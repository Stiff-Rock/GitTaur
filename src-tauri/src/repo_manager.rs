use crate::{
    git2json::{self, ChangeType, CommitLog, FileChanges},
    repo_info::{RepoInfo, RepoStatus},
};
use auth_git2::GitAuthenticator;
use git2::{
    AnnotatedCommit, BranchType, FetchOptions, IndexAddOption, MergeOptions, Reference, Repository,
    Signature, Status, StatusOptions,
};
use indexmap::IndexMap;
use std::{
    collections::{HashMap, HashSet},
    path::Path,
    sync::{LazyLock, Mutex},
};
use tauri::command;

static ACTIVE_REPOS: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

const BUSY_MSG: &str = "Repository busy. Please try again when other operations complete.";

//TODO: DELETE ON RELEASE
#[command]
pub async fn reset() -> Result<(), String> {
    match ACTIVE_REPOS.lock() {
        Ok(mut active_repos) => {
            active_repos.clear();
            Ok(())
        }

        Err(e) => Err(e.to_string()),
    }
}

fn is_repo_busy(repo_path: &String) -> bool {
    let mut active_repos = match ACTIVE_REPOS.lock() {
        Ok(guard) => guard,
        Err(err) => {
            eprintln!("Error checking if repo is busy: mutex poisoned - {}", err);
            return true;
        }
    };

    let is_busy = active_repos.contains(repo_path);

    if is_busy {
        active_repos.insert(repo_path.to_string());
    }

    is_busy
}

pub fn release_repo(repo_path: &String) {
    let mut active_repos = match ACTIVE_REPOS.lock() {
        Ok(guard) => guard,
        Err(err) => {
            eprintln!("Error releasing repo: mutex poisoned - {}", err);
            return;
        }
    };

    active_repos.remove(repo_path);
}

pub fn is_repo(repo_path: &String, has_lock: bool) -> Result<bool, String> {
    if !has_lock && is_repo_busy(repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let result = match Repository::open(repo_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    };

    release_repo(repo_path);

    result
}

#[command]
pub async fn create_repo(repo_path: String) -> Result<String, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let create_result = if is_repo(&repo_path, true)? {
        Err("This directory already contains a repository".to_string())
    } else {
        Repository::init(&repo_path)
            .map(|_| format!("Successfully created repository at {}", repo_path))
            .map_err(|e| format!("Error creating repository at '{}' - {}", repo_path, e))
    };

    release_repo(&repo_path);

    create_result
}

//TODO: AUTH AND let mut callbacks = RemoteCallbacks::new();
#[command]
pub async fn clone_repo(path: String, repo_url: String) -> Result<String, String> {
    if is_repo_busy(&path) {
        return Err(BUSY_MSG.to_string());
    }

    let clone_path = Path::new(&path);
    let result = match Repository::clone(&repo_url, &clone_path) {
        Ok(_) => Ok("Repository cloned successfully".to_string()),
        Err(e) => {
            eprintln!("Technical error details: {:?}", e);

            Err(match e.code() {
                git2::ErrorCode::Auth => {
                    format!("Authentication failed for repository:\n{}", repo_url)
                }
                git2::ErrorCode::NotFound => {
                    format!("Repository not found for the provided URL:\n{}", repo_url)
                }
                git2::ErrorCode::Exists => format!(
                    "The target directory is not empty:\n{}",
                    clone_path.display()
                ),
                git2::ErrorCode::Certificate => "SSL certificate verification failed".to_string(),
                _ => {
                    let err_msg = format!(
                        "Failed to clone the repository from:\n{}\n\n\
                            Error details: {}",
                        repo_url,
                        e.message()
                    );

                    eprintln!("{}", err_msg);

                    err_msg
                }
            })
        }
    };

    release_repo(&path);

    result
}

fn get_current_branch(repo: &Repository) -> String {
    match repo.head() {
        Ok(head) => head.shorthand().unwrap_or("Unknown").to_string(),
        Err(_) => "Unknown".to_string(),
    }
}

#[command]
pub async fn get_repo_info(repo_path: String) -> Result<RepoInfo, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    if !is_repo(&repo_path, true)? {
        return Err(format!("{} is not a repository", &repo_path));
    }

    let result = (|| {
        let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
        let name = repo_path.to_string();

        // Get the branch that is considered the principal in this repo
        let main_branch: String;
        if repo.head_detached().map_err(|e| e.to_string())? {
            main_branch = "master".to_string();
        } else {
            let head = repo.head().map_err(|e| e.to_string())?;
            if let Some(branch_name) = head.shorthand() {
                main_branch = branch_name.to_string();
            } else {
                panic!("\nCould not determine the current branch.");
            }
        }

        // Get current branch
        let current_branch = get_current_branch(&repo);

        // Get local branches
        let local_branches = repo
            .branches(Some(git2::BranchType::Local))
            .map_err(|e| e.to_string())?
            .filter_map(|b| b.ok())
            .filter_map(|(b, _)| b.name().ok().flatten().map(|s| s.to_owned()))
            .collect::<Vec<String>>();

        let tags = repo
            .tag_names(None)
            .map_err(|e| e.to_string())?
            .iter()
            .filter_map(|t| t.map(|s| s.to_string()))
            .collect::<Vec<String>>();

        let commit_history: IndexMap<String, CommitLog> = git2json::get_repo_json(&repo_path)
            .map_err(|e| format!("Error while processing commit history - {}", e.to_string()))?
            .into_iter()
            .enumerate()
            .map(|(_, v)| (v.hash.clone(), v))
            .collect();

        let remotes: HashMap<String, Vec<String>> = get_remote_branches(&repo)?;

        //TODO: TAGS ARE NOT DISPLAYED ON GRAPHS
        let repo = RepoInfo {
            name,
            main_branch,
            current_branch,
            local_branches,
            remotes,
            tags,
            commit_history,
        };

        //println!("\n--{}--\n", serde_json::to_string_pretty(&repo).unwrap());

        Ok(repo)
    })();

    release_repo(&repo_path);

    result
}

fn get_remote_branches(repo: &Repository) -> Result<HashMap<String, Vec<String>>, String> {
    let remote_branches = repo
        .branches(Some(BranchType::Remote))
        .map_err(|e| e.to_string())?;

    let mut remote_branches_map: HashMap<String, Vec<String>> = HashMap::new();
    for branch_entry in remote_branches {
        let (branch, _branch_type) = branch_entry.map_err(|e| e.to_string())?;
        let branch_full_name = branch
            .name()
            .map_err(|e| e.to_string())?
            .unwrap_or_else(|| {
                eprintln!(
                    "Warning: Invalid branch name in entry {:?}",
                    branch.name_bytes()
                );
                "(invalid)"
            });

        let info: Vec<&str> = branch_full_name.split('/').collect();

        if info.len() == 2 {
            let remote = info.first().copied().unwrap_or("Unknown remote");
            let name = info.last().copied().unwrap_or("Unknown branch");

            if name == "HEAD" {
                continue;
            }

            remote_branches_map
                .entry(remote.to_string())
                .or_default()
                .push(name.to_string());
        } else {
            eprintln!(
                "WARNING!!!! BRANCH NAME SPLIT RESULTED ON MORE THAN2: {}",
                branch_full_name
            )
        }
    }

    Ok(remote_branches_map)
}

#[command]
pub async fn get_repo_status(repo_path: String) -> Result<RepoStatus, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut status_opts = StatusOptions::new();
    status_opts
        .include_untracked(true)
        .show(git2::StatusShow::IndexAndWorkdir)
        .include_unmodified(false);

    let statuses = repo
        .statuses(Some(&mut status_opts))
        .map_err(|e| e.to_string())?;

    let mut unstaged_files: Vec<FileChanges> = Vec::new();
    let mut staged_files: Vec<FileChanges> = Vec::new();

    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            let status = entry.status();
            let path_str = path.to_string();

            if status.intersects(
                Status::INDEX_NEW
                    | Status::INDEX_MODIFIED
                    | Status::INDEX_DELETED
                    | Status::INDEX_RENAMED
                    | Status::INDEX_TYPECHANGE,
            ) {
                let change_type =
                    determine_change_type(status, Status::INDEX_DELETED, Status::INDEX_NEW);
                staged_files.push(FileChanges {
                    change_type,
                    file: path_str.clone(),
                });
            }

            if status.intersects(
                Status::WT_NEW
                    | Status::WT_MODIFIED
                    | Status::WT_DELETED
                    | Status::WT_RENAMED
                    | Status::WT_TYPECHANGE,
            ) {
                let change_type = determine_change_type(status, Status::WT_DELETED, Status::WT_NEW);
                unstaged_files.push(FileChanges {
                    change_type,
                    file: path_str,
                });
            }
        }
    }

    release_repo(&repo_path);

    Ok(RepoStatus {
        unstaged_files,
        staged_files,
    })
}

fn determine_change_type(status: Status, deleted_flag: Status, new_flag: Status) -> ChangeType {
    if status.contains(deleted_flag) {
        ChangeType::Deleted
    } else if status.contains(new_flag) {
        ChangeType::Added
    } else {
        ChangeType::Modified
    }
}

#[command]
pub async fn add_to_staging_area(repo_path: String, files: Vec<String>) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    if files.is_empty() {
        index
            .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
            .map_err(|e| e.to_string())?;
    } else {
        for file in &files {
            index.add_path(Path::new(file)).map_err(|e| e.to_string())?;
        }
    }

    index.write().map_err(|e| e.to_string())?;

    release_repo(&repo_path);

    Ok(())
}

#[command]
pub async fn remove_from_staging_area(repo_path: String, files: Vec<String>) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    if files.is_empty() {
        let head = repo.head().map_err(|e| e.to_string())?;
        let obj = head
            .peel(git2::ObjectType::Tree)
            .map_err(|e| e.to_string())?;
        let tree = obj.as_tree().ok_or("Could not find tree")?;

        index.read_tree(&tree).map_err(|e| e.to_string())?;
    } else {
        for file in &files {
            index
                .remove_path(Path::new(file))
                .map_err(|e| e.to_string())?;
        }
    }

    index.write().map_err(|e| e.to_string())?;

    release_repo(&repo_path);

    Ok(())
}

//TODO: AUTH AND let mut callbacks = RemoteCallbacks::new();
#[command]
pub async fn fetch_remote(repo_path: String, remotes: Vec<String>) -> Result<String, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
    let mut any_updates = false;

    for remote_name in remotes {
        let refs_before = get_remote_refs(&repo, &remote_name)?;

        let mut remote = repo.find_remote(&remote_name).map_err(|e| e.to_string())?;
        let mut fetch_options = FetchOptions::new();

        remote
            .fetch(&[] as &[&str], Some(&mut fetch_options), None)
            .map_err(|e| format!("Failed to fetch from remote '{}': {}", &remote_name, e))?;

        let refs_after = get_remote_refs(&repo, &remote_name)?;

        if find_updated_refs(&refs_before, &refs_after) {
            any_updates = true;
        }
    }

    release_repo(&repo_path);

    if any_updates {
        Ok("Successfully fetched remotes".to_string())
    } else {
        Ok("Already up-to-date".to_string())
    }
}

fn get_remote_refs(
    repo: &Repository,
    remote_name: &str,
) -> Result<HashMap<String, git2::Oid>, String> {
    let mut refs = HashMap::new();
    let remote_prefix = format!("refs/remotes/{}/", remote_name);

    let references = repo.references().map_err(|e| e.to_string())?;
    for reference_result in references {
        let reference = reference_result.map_err(|e| e.to_string())?;
        if let Some(name) = reference.name() {
            if name.starts_with(&remote_prefix) {
                if let Some(target) = reference.target() {
                    refs.insert(name.to_string(), target);
                }
            }
        }
    }

    Ok(refs)
}

fn find_updated_refs(
    before: &HashMap<String, git2::Oid>,
    after: &HashMap<String, git2::Oid>,
) -> bool {
    for (name, oid_after) in after {
        match before.get(name) {
            Some(oid_before) if oid_before != oid_after => {
                return true;
            }
            None => {
                return true;
            }
            _ => {}
        }
    }

    false
}

//TODO: AUTH AND let mut callbacks = RemoteCallbacks::new();
#[command]
pub async fn pull_remote(
    repo_path: String,
    remote_name: String,
    branches: Vec<String>,
) -> Result<String, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut fetch_options = FetchOptions::new();

    let mut remote = repo
        .find_remote(&remote_name)
        .map_err(|e| format!("Couldn't find remote '{}': {}", remote_name, e))?;

    // Get the current branch ref
    let current_branch_name = get_current_branch(&repo);
    let current_branch_ref = format!("refs/heads/{}", current_branch_name);

    let mut has_updated_content: bool = false;
    for branch_name in branches {
        remote
            .fetch(&[branch_name], Some(&mut fetch_options), None)
            .map_err(|e| format!("Failed to fetch from '{}': {}", &remote_name, e))?;

        // 2. Get the fetched commit to merge
        let fetch_head = repo
            .find_reference("FETCH_HEAD")
            .map_err(|e| format!("Failed to find FETCH_HEAD: {}", e))?;

        let fetch_commit = repo
            .reference_to_annotated_commit(&fetch_head)
            .map_err(|e| format!("Failed to get commit from FETCH_HEAD: {}", e))?;

        let mut current_ref = repo
            .find_reference(&current_branch_ref)
            .map_err(|e| format!("Failed to find reference '{}': {}", current_branch_ref, e))?;

        let current_commit = repo
            .reference_to_annotated_commit(&current_ref)
            .map_err(|e| format!("Failed to get commit from reference: {}", e))?;

        // 4. Do the merge analysis
        let (merge_analysis, _merge_preference) = repo
            .merge_analysis(&[&fetch_commit])
            .map_err(|e| format!("Failed to perform merge analysis: {}", e))?;

        if merge_analysis.is_fast_forward() {
            // Fast-forward merge
            let res = fast_forward(&repo, &mut current_ref, &fetch_commit);

            if res.is_err() {
                return res;
            }

            has_updated_content = true;
        } else if merge_analysis.is_normal() {
            // Normal (non-fast-forward) merge
            let res = normal_merge(&repo, &current_commit, &fetch_commit);

            if res.is_err() {
                return res;
            }

            has_updated_content = true;
        }
    }

    release_repo(&repo_path);

    let msg: String = if has_updated_content {
        "Successfully pulled changes".to_string()
    } else {
        "Already up-to-date".to_string()
    };

    Ok(msg)
}

// Handle a fast-forward merge
fn fast_forward(
    repo: &Repository,
    reference: &mut Reference,
    fetch_commit: &AnnotatedCommit,
) -> Result<String, String> {
    let commit_id = fetch_commit.id();
    let name = reference.name().unwrap_or("unknown").to_string();

    // Fast-forward the reference
    reference
        .set_target(
            commit_id,
            &format!("Fast-forward: Setting {} to id: {}", name, commit_id),
        )
        .map_err(|e| format!("Failed to fast-forward: {}", e))?;

    // Update the working directory
    repo.checkout_tree(
        &repo.find_object(commit_id, None).unwrap(),
        Some(git2::build::CheckoutBuilder::new().force()),
    )
    .map_err(|e| format!("Failed to update working directory: {}", e))?;

    repo.set_head(&name)
        .map_err(|e| format!("Failed to update HEAD: {}", e))?;

    Ok(format!("Fast-forward merge successful to {}", commit_id))
}

fn normal_merge(
    repo: &Repository,
    local_commit: &AnnotatedCommit,
    remote_commit: &AnnotatedCommit,
) -> Result<String, String> {
    // Set up merge options
    let mut merge_options = MergeOptions::new();
    merge_options.fail_on_conflict(false);

    // Perform the merge
    repo.merge(&[remote_commit], Some(&mut merge_options), None)
        .map_err(|e| format!("Failed to merge: {}", e))?;

    // Check for conflicts
    if repo.index().map_err(|e| e.to_string())?.has_conflicts() {
        repo.cleanup_state()
            .map_err(|e| format!("Failed to clean up state: {}", e))?;
        return Err("Merge conflicts detected. Please resolve them manually.".to_string());
    }

    // Create the merge commit
    let sig = repo
        .signature()
        .map_err(|e| format!("Failed to get signature: {}", e))?;
    let tree_id = repo.index().unwrap().write_tree().unwrap();
    let tree = repo.find_tree(tree_id).unwrap();

    // Get the parent commits
    let local_commit_obj = repo.find_commit(local_commit.id()).unwrap();
    let remote_commit_obj = repo.find_commit(remote_commit.id()).unwrap();

    // Create the merge commit
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &format!("Merge: {} into {}", remote_commit.id(), local_commit.id()),
        &tree,
        &[&local_commit_obj, &remote_commit_obj],
    )
    .map_err(|e| format!("Failed to create merge commit: {}", e))?;

    // Cleanup
    repo.cleanup_state()
        .map_err(|e| format!("Failed to clean up state: {}", e))?;

    Ok("Merge successful".to_string())
}

//TODO: AUTH AND let mut callbacks = RemoteCallbacks::new();
#[command]
pub async fn push_remote(
    repo_path: String,
    remote: String,
    local_branch: String,
    remote_branch: String,
) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let auth = GitAuthenticator::default();

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote(&remote).map_err(|e| e.to_string())?;
    let refspec = format!("refs/heads/{}:refs/heads/{}", local_branch, remote_branch);

    auth.push(&repo, &mut remote, &[&refspec])
        .map_err(|e| e.to_string())?;

    release_repo(&repo_path);

    Ok(())
}

#[command]
pub async fn create_branch(repo_path: String) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    release_repo(&repo_path);

    Ok(())
}

#[command]
pub async fn commit(
    repo_path: String,
    commit_summary: String,
    commit_body: String,
) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    //TODO: FOR NOW GET THE USER'S CONFIG DIRECTLY, BUT LATER DO CONFIG OPTIONS
    let config = repo.config().map_err(|e| e.to_string())?;
    let name = config.get_string("user.name").map_err(|e| e.to_string())?;
    let email = config.get_string("user.email").map_err(|e| e.to_string())?;
    let signature = Signature::now(&name, &email).map_err(|e| e.to_string())?;

    let message = if commit_body.trim().is_empty() {
        commit_summary.to_string()
    } else {
        format!("{}\n\n{}", commit_summary, commit_body)
    };

    let tree_id = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|e| e.to_string())?;

    let parents = match repo.head() {
        Ok(head) => {
            if let Some(oid) = head.target() {
                vec![repo.find_commit(oid).map_err(|e| e.to_string())?]
            } else {
                vec![]
            }
        }
        Err(_) => vec![],
    };

    let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

    repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        &message,
        &tree,
        &parent_refs,
    )
    .map_err(|e| e.to_string())?;

    release_repo(&repo_path);

    Ok(())
}
