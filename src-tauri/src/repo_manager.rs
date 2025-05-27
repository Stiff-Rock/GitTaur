use crate::{
    config_manager::config,
    git2json::{self, ChangeType, CommitLog, FileChanges},
    types::{
        repo_guard::RepoGuard,
        repo_info::{RepoInfo, RepoStatus},
    },
};
use auth_git2_pem::GitAuthenticator;
use git2::{
    build::CheckoutBuilder, AnnotatedCommit, BranchType, FetchOptions, IndexAddOption,
    MergeOptions, Reference, Repository, Signature, Status, StatusOptions,
};
use indexmap::IndexMap;
use log::{error, info};
use std::{collections::HashMap, path::Path};
use tauri::{command, AppHandle};
use tauri_plugin_shell::{self, ShellExt};

//TODO: GitAuthenticator::set_prompter()
pub fn is_repo(repo_path: &String, has_lock: bool) -> Result<bool, String> {
    let _repo_lock;
    if !has_lock {
        _repo_lock = RepoGuard::new(repo_path, true)?;
    }

    match Repository::open(repo_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[command]
pub async fn create_repo(repo_path: String) -> Result<String, String> {
    info!("Creating repository at {}", repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    if is_repo(&repo_path, true)? {
        Err("This directory already contains a repository".to_string())
    } else {
        Repository::init(&repo_path)
            .map(|_| format!("Successfully created repository at {}", repo_path))
            .map_err(|e| format!("Error creating repository at '{}' - {}", repo_path, e))
    }
}

//TODO: Live loading feedback
#[command]
pub async fn clone_repo(
    app_handle: AppHandle,
    repo_path: String,
    repo_url: String,
) -> Result<(String, String), String> {
    info!("Cloning {} into {}", repo_url, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let last_component = repo_url.split("/").last().unwrap_or("");

    let repo_name = last_component
        .strip_suffix(".git")
        .unwrap_or(last_component);

    let clone_path = Path::new(&repo_path).join(repo_name);

    if clone_path.exists() {
        return Err(format!(
            "Error: directory already exists at '{}'",
            clone_path.display()
        ));
    }

    let auth = GitAuthenticator::new();

    let git2_clone_result = auth.clone_repo(&repo_url, &clone_path);

    let repo_path = clone_path.to_string_lossy().to_string();

    // Falback to git clone through commands
    if let Err(err) = git2_clone_result {
        info!("git2 clone method failed: {}", err);

        let shell = app_handle.shell();

        let output = shell
            .command("git")
            .args(["clone", &repo_url, &repo_path])
            .output()
            .await
            .map_err(|e| format!("Failed to execute git clone command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);

            return Err(format!("Error cloning repository - {}", stderr));
        }
    }

    Ok((repo_path, "Successfully cloned repository".to_string()))
}

fn get_current_branch(repo: &Repository) -> String {
    match repo.head() {
        Ok(head) => head.shorthand().unwrap_or("Unknown").to_string(),
        Err(_) => "Unknown".to_string(),
    }
}

#[command]
pub async fn get_repo_info(repo_path: String) -> Result<RepoInfo, String> {
    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    if !is_repo(&repo_path, true)? {
        return Err(format!("{} is not a repository", &repo_path));
    }

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

    //TODO: TAGS ARE NOT DISPLAYED ON GRAPHS IF BRANCH LABEL IS PRESENT AND VICEVERSA
    let repo = RepoInfo {
        name,
        main_branch,
        current_branch,
        local_branches,
        remotes,
        tags,
        commit_history,
    };

    //debug!("\n--{}--\n", serde_json::to_string_pretty(&repo).unwrap());

    Ok(repo)
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
                error!("Invalid branch name in entry {:?}", branch.name_bytes());
                "##invalid##"
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
            error!(
                "Branch name split - Expected two tokens but instead got more: {}",
                branch_full_name
            )
        }
    }

    Ok(remote_branches_map)
}

#[command]
pub async fn get_repo_status(repo_path: String) -> Result<RepoStatus, String> {
    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut status_opts = StatusOptions::new();
    status_opts
        .include_untracked(true)
        .show(git2::StatusShow::IndexAndWorkdir)
        .include_unmodified(false)
        .recurse_untracked_dirs(true)
        .recurse_ignored_dirs(false);

    let statuses = repo
        .statuses(Some(&mut status_opts))
        .map_err(|e| e.to_string())?;

    let mut unstaged_files: Vec<FileChanges> = Vec::new();
    let mut staged_files: Vec<FileChanges> = Vec::new();

    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            let status = entry.status();
            let path_str = path.to_string();

            let full_path = Path::new(&repo_path).join(path);
            if full_path.is_dir() {
                continue;
            }

            // Checks the file changes present in the staging area
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

            // Checks the file changes present in the working directory
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
    info!("Staging {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    if files.is_empty() {
        index
            .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
            .map_err(|e| e.to_string())?;
    } else {
        for file in &files {
            let file_path = Path::new(&repo_path).join(file);

            if file_path.exists() {
                index.add_path(Path::new(file)).map_err(|e| e.to_string())?;
            } else {
                index
                    .remove_path(Path::new(file))
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    index.write().map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn remove_from_staging_area(repo_path: String, files: Vec<String>) -> Result<(), String> {
    info!("Unstaging {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

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
        if let Ok(head) = repo.head() {
            let head_commit = head.peel_to_commit().map_err(|e| e.to_string())?;

            for file in &files {
                let commit_obj = head_commit.as_object();

                repo.reset_default(Some(commit_obj), &[Path::new(&file)])
                    .map_err(|e| e.to_string())?;
            }
        } else {
            for file in &files {
                index
                    .remove_path(Path::new(file))
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    index.write().map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn discard_changes(repo_path: String, files: Vec<String>) -> Result<(), String> {
    info!("Discarding {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
    let tree = commit.tree().map_err(|e| e.to_string())?;

    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true);
    let statuses = repo
        .statuses(Some(&mut status_opts))
        .map_err(|e| e.to_string())?;

    let tree_obj = tree.as_object();
    for file in &files {
        let is_untracked = statuses.iter().any(|entry| {
            entry.path().map_or(false, |path| path == file)
                && entry.status().contains(git2::Status::WT_NEW)
        });

        if is_untracked {
            // For untracked files, remove them directly
            let full_path = std::path::Path::new(&repo_path).join(file);
            if full_path.exists() {
                std::fs::remove_file(&full_path).map_err(|e| e.to_string())?;
            }
        } else {
            // For tracked files, use checkout to restore from HEAD
            let mut checkout_opts = CheckoutBuilder::new();
            checkout_opts.force().path(file);
            if let Err(e) = repo.checkout_tree(tree_obj, Some(&mut checkout_opts)) {
                error!("Checkout failed for {}: {}", file, e);
            }
        }
    }

    Ok(())
}

//TODO: Live loading feedback
#[command]
pub async fn fetch_remote(
    app_handle: AppHandle,
    repo_path: String,
    remotes: Vec<String>,
) -> Result<String, String> {
    info!("Fetching remotes of repository at {}", repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let mut any_updates = false;

    for remote_name in &remotes {
        let refs_before = {
            let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
            get_remote_refs(&repo, remote_name)?
        };

        let git2_fetch_success = {
            let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
            let mut remote = repo.find_remote(remote_name).map_err(|e| e.to_string())?;
            let refspecs = &[] as &[&str];
            let auth = GitAuthenticator::new();

            match auth.fetch(&repo, &mut remote, refspecs, None) {
                Ok(_) => true,
                Err(e) => {
                    info!("git2 failed to fetch from remote '{}': {}", remote_name, e);
                    false
                }
            }
        };

        // If git2 fails, try using shell command
        if !git2_fetch_success {
            let shell = app_handle.shell();

            let output = shell
                .command("git")
                .args(["fetch", remote_name])
                .output()
                .await
                .map_err(|e| format!("Failed to execute git fetch command: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);

                return Err(format!("Error fetching - {}", stderr));
            }
        }

        // Check for updates after fetching
        let refs_after = {
            let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
            get_remote_refs(&repo, remote_name)?
        };

        if find_updated_refs(&refs_before, &refs_after) {
            any_updates = true;
        }
    }

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

//TODO: Live loading feedback
#[command]
pub async fn pull_remote(
    repo_path: String,
    remote_name: String,
    branches: Vec<String>,
) -> Result<String, String> {
    info!(
        "Pulling from remote {} of repository at {}",
        remote_name, repo_path
    );

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

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

    let msg: String = if has_updated_content {
        "Successfully pulled changes".to_string()
    } else {
        "Already up-to-date".to_string()
    };

    Ok(msg)
}

//TODO: REBASING

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

//TODO: Live loading feedback
#[command]
pub async fn push_remote(
    app_handle: AppHandle,
    repo_path: String,
    remote_name: String,
    local_branch: String,
    remote_branch: String,
    force_push: bool,
) -> Result<(), String> {
    info!(
        "Pushing changes to remote {} of repository at {}",
        remote_name, repo_path
    );

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let refspec = format!("refs/heads/{}:refs/heads/{}", local_branch, remote_branch);

    let push_result = {
        let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
        let mut remote = repo.find_remote(&remote_name).map_err(|e| e.to_string())?;

        // Add "+" prefix to refspec if force_push is true
        let refspec = if force_push {
            format!("+refs/heads/{}:refs/heads/{}", local_branch, remote_branch)
        } else {
            format!("refs/heads/{}:refs/heads/{}", local_branch, remote_branch)
        };

        let auth = GitAuthenticator::new();
        auth.push(&repo, &mut remote, &[&refspec])
    };

    if let Err(err) = push_result {
        info!("git2 push failed: {err}");

        let shell = app_handle.shell();

        let mut args = vec!["push"];
        if force_push {
            args.push("--force");
        }
        args.push(&remote_name);
        args.push(&refspec);

        let output = shell
            .command("git")
            .args(args)
            .output()
            .await
            .map_err(|e| format!("Failed to execute git push command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);

            return Err(format!("Error pushing to remote - {}", stderr));
        }
    }

    Ok(())
}

#[command]
pub async fn create_branch(
    repo_path: String,
    branch_name: String,
    checkout: bool,
) -> Result<String, String> {
    info!(
        "Creating branch with name {} in repository at {}",
        branch_name, repo_path
    );

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;

    let branch_ref = repo
        .branch(&branch_name, &commit, false)
        .map_err(|e| e.to_string())?;

    if checkout {
        let branch_ref = branch_ref
            .get()
            .name()
            .ok_or("Invalid branch name")?
            .to_string();

        let mut checkout_builder = CheckoutBuilder::new();

        repo.set_head(&branch_ref).map_err(|e| e.to_string())?;
        repo.checkout_head(Some(&mut checkout_builder))
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("Successfully created {} branch", branch_name))
}

#[command]
pub async fn commit(
    repo_path: String,
    commit_summary: String,
    commit_body: String,
) -> Result<(), String> {
    info!("Committing in repository at {}", repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;

    let config = config();
    let signature = Signature::now(&config.username, &config.email).map_err(|e| e.to_string())?;

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

    Ok(())
}
