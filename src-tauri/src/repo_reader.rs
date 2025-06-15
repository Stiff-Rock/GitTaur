use git2::{
    BranchType, Delta, Diff, DiffOptions, ObjectType, Oid, ReferenceType, Repository, Revwalk,
    Sort, Status, StatusOptions,
};
use indexmap::IndexMap;
use log::{info, trace};
use std::collections::HashSet;
use std::path::Path;
use std::{collections::HashMap, num::TryFromIntError};
use tauri::command;

use crate::config_manager::get_config;
use crate::types::repo_info::RepoHistory;
use crate::{
    repo_manager::is_repo,
    types::{
        repo_guard::RepoGuard,
        repo_info::{
            ChangeType, Commit, FileChanges, Remote, RepoInfo, RepoStatus, Stash, UserInfo,
        },
    },
};

/// Returns informatation about the repository, not including the commit history
#[command]
pub async fn get_repo_info(repo_path: String) -> Result<RepoInfo, String> {
    info!("Getting info of repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    if !is_repo(&repo_path, true)? {
        return Err(format!("{repo_path} is not a repository"));
    }

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;
    let name = repo_path.to_string();

    // Get current branch
    let current_branch = get_current_branch(&repo);

    // Get local branches
    let local_branches = repo
        .branches(Some(git2::BranchType::Local))
        .map_err(|e| format!("Could not obtain local branches of repository: {e}"))?
        .filter_map(|b| b.ok())
        .filter_map(|(b, _)| b.name().ok().flatten().map(|s| s.to_owned()))
        .collect::<Vec<String>>();

    // Get the tags
    let tags = repo
        .tag_names(None)
        .map_err(|e| format!("Could not obtain tags of respository: {e}"))?
        .iter()
        .filter_map(|t| t.map(|s| s.to_string()))
        .collect::<Vec<String>>();

    let remotes: HashMap<String, Remote> = get_remote_branches(&repo)?;

    let repo = RepoInfo {
        name,
        current_branch,
        local_branches,
        remotes,
        tags,
    };

    trace!("Finished obtaining info of repo {repo_path}");

    Ok(repo)
}

fn get_current_branch(repo: &Repository) -> String {
    match repo.head() {
        Ok(head) => head.shorthand().unwrap_or("Unknown").to_string(),
        Err(_) => "Unknown".to_string(),
    }
}

fn get_remote_branches(repo: &Repository) -> Result<HashMap<String, Remote>, String> {
    let mut remote_branches_map: HashMap<String, Remote> = HashMap::new();

    let remote_names = repo
        .remotes()
        .map_err(|e| format!("Falied to get repo remotes {e}"))?;

    for i in 0..remote_names.len() {
        let remote_name = if let Some(name) = remote_names.get(i) {
            name
        } else {
            return Err(
                "Unexpectedly encountered None value while getting remote branches".to_string(),
            );
        };
        let remote_ref = repo
            .find_remote(&remote_name)
            .map_err(|e| format!("Could not find remote \"{remote_name}\": {e}"))?;
        let remote_url = remote_ref
            .url()
            .unwrap_or("Unkown Url: Please report this issue");
        let branches = repo
            .branches(Some(BranchType::Remote))
            .map_err(|e| format!("Could not obtain remote branches of repository: {e}"))?;

        let mut remote_branches: Vec<String> = vec![];
        for branch_result in branches {
            let (branch, _) = if branch_result.is_ok() {
                branch_result.expect("Unable to obtain remote branch reference")
            } else {
                continue;
            };

            let branch_name = branch
                .name()
                .map_err(|e| format!("Could not get remote branch name: {e}"))?
                .unwrap_or("[unknown]");

            if branch_name.starts_with(&format!("{}/", remote_name)) {
                let clean_branch_name = &branch_name[remote_name.len() + 1..];

                if clean_branch_name != "HEAD" {
                    remote_branches.push(clean_branch_name.to_string());
                }
            }
        }

        let remote_obj = Remote {
            name: remote_name.to_string(),
            url: remote_url.to_string(),
            branches: remote_branches,
        };

        remote_branches_map.insert(remote_name.to_string(), remote_obj);
    }

    Ok(remote_branches_map)
}

/// Returns the commit history of the repo as an map of commit id as key and a commit object as
/// value serialized into a string for better 'rust indexmap to typescript map' compatibilty
#[command]
pub async fn get_commit_history(repo_path: String) -> Result<String, String> {
    info!("Getting commit history of repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    match repo.head() {
        Ok(head_ref) => match head_ref.target() {
            Some(_) => {}
            None => return Ok("".to_string()),
        },
        Err(_) => return Ok("".to_string()),
    }

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Could not obtain revwalk while getting commit history: {e}"))?;

    revwalk
        .push_glob("refs/heads/*")
        .map_err(|e| format!("Failed to add heads to revwalk: {e}"))?;
    revwalk
        .push_glob("refs/tags/*")
        .map_err(|e| format!("Failed to add tags to revwalk: {e}"))?;
    revwalk
        .push_glob("refs/remotes/*")
        .map_err(|e| format!("Failed to add remotes to revwalk: {e}"))?;

    revwalk
        .set_sorting(Sort::TIME | Sort::TOPOLOGICAL)
        .map_err(|e| format!("Failed to set revwalk sorting: {e}"))?;

    let max_commits = get_config()?.max_commits as usize;

    // First, collect all references in the repository and create a mapping
    let ref_map = get_refs_map(&repo).map_err(|e| format!("Could not obtain refs map: {e}"))?;

    // Map the commit objects
    let commit_history_map = get_commit_history_map(&repo, revwalk, &ref_map, max_commits)
        .map_err(|e| format!("Could not obtain commit history map: {e}"))?;

    // Check if repo head is detached
    let head_is_detached = repo
        .head_detached()
        .map_err(|e| format!("Could not determine head state: {e}"))?;

    // Get the current commit the repository is checked out on
    let head = repo
        .head()
        .map_err(|e| format!("Could not obtain head of repository: {e}"))?;
    let head_commit = head
        .peel_to_commit()
        .map_err(|e| format!("Could not obtain head commit: {e}"))?;
    let current_commit_id = head_commit.id().to_string();

    let repo_history = RepoHistory {
        commit_history_map,
        head_is_detached,
        current_commit_id,
    };

    let repo_history_json = serde_json::to_string(&repo_history)
        .map_err(|e| format!("Failed to serialize repo_history: {e}"))?;

    trace!("Finished getting commit history of repo {repo_path}");

    Ok(repo_history_json)
}

fn get_refs_map(repo: &Repository) -> Result<HashMap<String, Vec<String>>, git2::Error> {
    let mut ref_map: HashMap<String, Vec<String>> = HashMap::new();

    let references = repo.references()?;
    for reference in references {
        let reference = reference?;
        if reference.kind() == Some(ReferenceType::Symbolic) {
            continue;
        }

        // Get the reference name
        let name = match reference.name() {
            Some(name) => name,
            None => continue,
        };

        let target;
        let formatted_name;

        if name.starts_with("refs/tags/") {
            // Handle tag references (both lightweight and annotated)
            formatted_name = format!("tag:{}", name.strip_prefix("refs/tags/").unwrap_or(name));

            // For tags, peel to the commit to handle annotated tags
            target = match reference.peel_to_commit() {
                Ok(commit) => commit.id().to_string(),
                Err(_) => {
                    // If we can't peel to a commit, try to peel to the target object
                    match reference.peel(ObjectType::Any) {
                        Ok(obj) => obj.id().to_string(),
                        Err(_) => {
                            // If all else fails, use the direct target
                            match reference.target() {
                                Some(oid) => oid.to_string(),
                                None => continue,
                            }
                        }
                    }
                }
            };
        } else if name.starts_with("refs/heads/") {
            // Handle branch references
            formatted_name = format!(
                "branch:{}",
                name.strip_prefix("refs/heads/").unwrap_or(name)
            );

            // For branches, use the direct target
            target = match reference.target() {
                Some(oid) => oid.to_string(),
                None => continue,
            };
        } else if name.starts_with("refs/remotes/") {
            // Handle remote references
            formatted_name = format!(
                "remoteBranch:{}",
                name.strip_prefix("refs/remotes/").unwrap_or(name)
            );

            // For remotes, use the direct target
            target = match reference.target() {
                Some(oid) => oid.to_string(),
                None => continue,
            };
        } else {
            // Handle other references
            formatted_name = format!("other:{}", name);

            // For other refs, use the direct target
            target = match reference.target() {
                Some(oid) => oid.to_string(),
                None => continue,
            };
        }

        // Add to the ref map
        ref_map
            .entry(target)
            .or_insert_with(Vec::new)
            .push(formatted_name);
    }

    Ok(ref_map)
}

fn get_commit_history_map(
    repo: &Repository,
    revwalk: Revwalk<'_>,
    ref_map: &HashMap<String, Vec<String>>,
    max_commits: usize,
) -> Result<IndexMap<String, Commit>, git2::Error> {
    let mut commit_map: IndexMap<String, Commit> = IndexMap::with_capacity(max_commits);

    // Get the main branch first parent history
    let master_history: HashSet<String> = get_main_branch_history(&repo, max_commits)?;

    for (i, oid) in revwalk.enumerate() {
        if i >= max_commits {
            break;
        }

        let oid = oid?;
        let id = oid.to_string();
        let commit = repo.find_commit(oid)?;
        let commit_obj = get_commit_obj(repo, &commit, &ref_map, &master_history)?;
        commit_map.insert(id, commit_obj);
    }

    // Map parent-child relationships
    let mut child_relationships: IndexMap<String, Vec<String>> =
        IndexMap::with_capacity(commit_map.len());
    for (id, commit) in &commit_map {
        for parent_id in &commit.parents {
            if commit_map.contains_key(parent_id) {
                child_relationships
                    .entry(parent_id.clone())
                    .or_insert_with(Vec::new)
                    .push(id.clone());
            }
        }
    }

    for (parent_id, children) in child_relationships {
        if let Some(parent_commit) = commit_map.get_mut(&parent_id) {
            parent_commit.children.extend(children);
        }
    }

    commit_map.reverse();

    Ok(commit_map)
}

fn get_main_branch_history(
    repo: &Repository,
    max_commits: usize,
) -> Result<HashSet<String>, git2::Error> {
    let mut master_history: HashSet<String> = HashSet::with_capacity(max_commits);

    let main_branch_name = get_default_branch_name(repo)?;

    let branch_ref = repo.find_branch(&main_branch_name, git2::BranchType::Local)?;
    let reference = branch_ref.into_reference();

    // Get the tip commit of the branch
    let tip_commit_id = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Could not get target for branch reference"))?;

    let mut current_commit = repo.find_commit(tip_commit_id)?;

    let mut count = 0;
    loop {
        let id = current_commit.id().to_string();
        master_history.insert(id);

        count += 1;
        if count >= max_commits {
            break;
        }

        if current_commit.parent_count() == 0 {
            break;
        }

        current_commit = current_commit.parent(0)?;
    }

    Ok(master_history)
}

fn get_default_branch_name(repo: &Repository) -> Result<String, git2::Error> {
    if repo.find_branch("main", BranchType::Local).is_ok() {
        return Ok("main".to_string());
    } else if repo.find_branch("master", BranchType::Local).is_ok() {
        return Ok("master".to_string());
    }

    if let Ok(head) = repo.head() {
        if head.is_branch() {
            if let Some(name) = head.shorthand() {
                return Ok(name.to_string()); // Create owned String
            }
        }
    }

    let branches = repo.branches(Some(BranchType::Local))?;
    for branch_result in branches {
        let (branch, _) = branch_result?;
        if let Some(name) = branch.name()? {
            return Ok(name.to_string()); // Create owned String
        }
    }

    Err(git2::Error::from_str("No branches found in repository"))
}

fn get_commit_obj(
    repo: &Repository,
    current_commit: &git2::Commit,
    ref_map: &HashMap<String, Vec<String>>,
    master_history: &HashSet<String>,
) -> Result<Commit, git2::Error> {
    let id = current_commit.id().to_string();

    let commit_parents = current_commit.parents();
    let mut parents: Vec<String> = Vec::new();
    for parent in commit_parents {
        parents.push(parent.id().to_string());
    }

    let git_author = current_commit.author();
    let name = git_author.name().unwrap_or("Unkown author").to_string();
    let email = git_author.email().unwrap_or("Unkown email").to_string();
    let timestamp = current_commit.time().seconds();
    let author = UserInfo {
        name,
        email,
        timestamp,
    };

    let date = current_commit.time().seconds().to_string();

    let subject = current_commit
        .summary()
        .unwrap_or("Unkown subject")
        .to_string();

    let body = current_commit.body().unwrap_or("").to_string();

    let refs = ref_map.get(&id).cloned().unwrap_or_else(Vec::new);

    let changes = get_commit_changes(repo, current_commit)?;

    let is_from_main_branch = master_history.contains(&id);

    let commit_obj = Commit {
        id: id,
        parents,
        children: vec![], // To be mapped later
        author,
        date,
        subject,
        body,
        refs,
        changes,
        is_from_main_branch,
    };

    Ok(commit_obj)
}

fn get_commit_changes(
    repo: &Repository,
    commit: &git2::Commit<'_>,
) -> Result<Vec<FileChanges>, git2::Error> {
    let mut changes = Vec::new();

    let commit_tree = commit.tree()?;

    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let diff_options = None;
    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), diff_options)?;

    diff.foreach(
        &mut |delta, _| {
            let file_path = match delta.status() {
                Delta::Deleted => delta.old_file().path(),
                _ => delta.new_file().path(),
            };

            if let Some(file_path) = file_path {
                let change_type = match delta.status() {
                    Delta::Added => ChangeType::Added,
                    Delta::Deleted => ChangeType::Deleted,
                    _ => ChangeType::Modified,
                };

                changes.push(FileChanges {
                    change_type,
                    file: file_path.to_string_lossy().into_owned(),
                });
            }

            true
        },
        None,
        None,
        None,
    )?;

    Ok(changes)
}

/// Returns the status of the index and working directory as well as untracked files
#[command]
pub async fn get_repo_status(repo_path: String) -> Result<RepoStatus, String> {
    info!("Getting repo status");

    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut status_opts = StatusOptions::new();
    status_opts
        .include_untracked(true)
        .show(git2::StatusShow::IndexAndWorkdir)
        .include_unmodified(false)
        .recurse_untracked_dirs(true)
        .recurse_ignored_dirs(false);

    let statuses = repo
        .statuses(Some(&mut status_opts))
        .map_err(|e| format!("Could not obtain repository statuses: {e}"))?;

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

/// Obtains the diff of a selected file change
#[command]
pub async fn get_file_diff(
    repo_path: String,
    file_path: String,
    status: String,
) -> Result<String, String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;
    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    match status.as_str() {
        "unstaged" => get_unstaged_file_diff(repo, file_path),
        "staged" => get_staged_file_diff(repo, file_path),
        _ => Err(format!("Invalid status: {}", status)),
    }
}

fn get_unstaged_file_diff(repo: Repository, file_path: String) -> Result<String, String> {
    // Set up diff options for this file
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(file_path);
    diff_opts.show_untracked_content(true);
    diff_opts.include_untracked(true);

    // Get diff between index and working directory
    let diff = repo
        .diff_index_to_workdir(None, Some(&mut diff_opts))
        .map_err(|e| format!("Could not obtain diff between index and working directory: {e}"))?;

    let diff_text = get_diff_content(diff)?;

    Ok(diff_text)
}

fn get_staged_file_diff(repo: Repository, file_path: String) -> Result<String, String> {
    // Get HEAD commit
    let head = repo
        .head()
        .map_err(|e| format!("Could not obtain head of repository: {e}"))?;
    let head_target = if let Some(target) = head.target() {
        target
    } else {
        return Err("Unable to obtain head target".to_string());
    };

    let head_commit = repo
        .find_commit(head_target)
        .map_err(|e| format!("Could not find head commit: {e}"))?;
    let head_tree = head_commit
        .tree()
        .map_err(|e| format!("Could not get tree of head commit: {e}"))?;

    // Set up diff options
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(file_path);

    // Get diff between HEAD and index
    let diff = repo
        .diff_tree_to_index(Some(&head_tree), None, Some(&mut diff_opts))
        .map_err(|e| format!("Could not obtain diff between head and index: {e}"))?;

    let diff_text = get_diff_content(diff)?;

    Ok(diff_text)
}

/// Gets the existing stashes in the repository
#[command]
pub async fn get_stashed_changes(repo_path: String) -> Result<Vec<Stash>, String> {
    info!("Getting repo stashed changes");

    let _repo_lock = RepoGuard::new(&repo_path, true)?;

    let mut repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut stash_entries: Vec<(String, usize, Oid)> = vec![];
    repo.stash_foreach(|index, name, stash_id| {
        stash_entries.push((name.to_string(), index, *stash_id));
        true
    })
    .map_err(|e| format!("Error iterating through repo stashes: {e}"))?;

    let mut stashes: Vec<Stash> = vec![];
    for (name, index, oid) in stash_entries {
        let stash_commit = repo
            .find_commit(oid)
            .map_err(|e| format!("Failed to obtain stash info for {name}-{oid}: {e}"))?;

        let timestamp = stash_commit.time().seconds();

        let contents: Vec<FileChanges> = get_stash_content(&repo, &stash_commit)
            .map_err(|e| format!("Failed to get stash changes for {name}-{oid}: {e}"))?;

        let id = oid.to_string();

        let index = index
            .try_into()
            .map_err(|e: TryFromIntError| e.to_string())?;

        stashes.push(Stash {
            id,
            index,
            name,
            timestamp,
            contents,
        });
    }

    Ok(stashes)
}

fn get_stash_content(
    repo: &Repository,
    commit: &git2::Commit,
) -> Result<Vec<FileChanges>, git2::Error> {
    let mut changes = Vec::new();

    if commit.parent_count() == 0 {
        return Ok(changes);
    }

    // Get the base commit (parent 0)
    let parent0 = commit.parent(0)?;
    let parent_tree = parent0.tree()?;

    // Get all the parent trees we need to diff
    let mut trees_to_diff = vec![
        commit.tree()?, // The stash itself (unstaged changes)
    ];

    // Add index changes if present
    if commit.parent_count() > 1 {
        trees_to_diff.push(commit.parent(1)?.tree()?);
    }

    // Add untracked files if present
    if commit.parent_count() > 2 {
        trees_to_diff.push(commit.parent(2)?.tree()?);
    }

    // Process all trees
    let mut diff_options = git2::DiffOptions::new();
    let mut file_set = std::collections::HashSet::new();

    for tree in trees_to_diff {
        let diff =
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), Some(&mut diff_options))?;

        diff.foreach(
            &mut |delta, _| {
                let file_path = match delta.status() {
                    Delta::Deleted => delta.old_file().path(),
                    _ => delta.new_file().path(),
                };

                if let Some(file_path) = file_path {
                    let path_str = file_path.to_string_lossy().into_owned();
                    if !file_set.contains(&path_str) {
                        file_set.insert(path_str.clone());

                        let change_type = match delta.status() {
                            Delta::Added => ChangeType::Added,
                            Delta::Deleted => ChangeType::Deleted,
                            _ => ChangeType::Modified,
                        };

                        changes.push(FileChanges {
                            change_type,
                            file: path_str,
                        });
                    }
                }
                true
            },
            None,
            None,
            None,
        )?;
    }

    Ok(changes)
}

/// Obtains the diff of a selected stashed file change
#[command]
pub async fn get_file_diff_from_stash(
    repo_path: String,
    stash_id: String,
    file_path: String,
) -> Result<String, String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    // Get the stash commit
    let oid = Oid::from_str(&stash_id)
        .map_err(|e| format!("Could not get stash id from string id \"{stash_id}\": {e}"))?;
    let stash_commit = repo
        .find_commit(oid)
        .map_err(|e| format!("Could not obtain stash commit: {e}"))?;

    // Get the parent commit (what you were on when stashing)
    let parent = stash_commit
        .parent(0)
        .map_err(|e| format!("Could not obtain the origin commit of stash: {e}"))?;

    // Set up diff options to focus on this specific file
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(file_path);

    // Create the diff between parent and stash
    let diff = repo
        .diff_tree_to_tree(
            Some(
                &parent
                    .tree()
                    .map_err(|e| format!("Could not obtain origin commit tree: {e}"))?,
            ),
            Some(
                &stash_commit
                    .tree()
                    .map_err(|e| format!("Could not obtain stash commit tree: {e}"))?,
            ),
            Some(&mut diff_opts),
        )
        .map_err(|e| format!("Could not create diff between stash and origin commit: {e}"))?;

    let diff_text = get_diff_content(diff)?;

    Ok(diff_text)
}

/// Converts diff to text format
fn get_diff_content(diff: Diff<'_>) -> Result<String, String> {
    let mut diff_html = String::from("<div class=\"diff\">");
    let mut in_hunk = false;

    diff.print(git2::DiffFormat::Patch, |delta, _hunk, line| {
        if let Ok(content) = std::str::from_utf8(line.content()) {
            // Start a new file section
            if content.starts_with("diff --git") {
                if in_hunk {
                    diff_html.push_str("</pre>");
                    in_hunk = false;
                }
                let file_name = delta
                    .new_file()
                    .path()
                    .or_else(|| delta.old_file().path())
                    .map_or("Unknown file", |p| p.to_str().unwrap_or("Unknown file"));

                diff_html.push_str(&format!(
                    "<div class=\"file-header\">{}</div>",
                    html_escape(file_name)
                ));
                return true;
            }

            // Format hunk header
            if line.origin() == 'H' {
                if in_hunk {
                    diff_html.push_str("</pre>");
                }
                diff_html.push_str("<pre class=\"hunk\">");
                diff_html.push_str(&format!(
                    "<span class=\"hunk-header\">{}</span>",
                    html_escape(content)
                ));
                in_hunk = true;
                return true;
            }

            // Ensure we're in a hunk
            if !in_hunk {
                diff_html.push_str("<pre class=\"hunk\">");
                in_hunk = true;
            }

            // Format line based on type
            let (class, prefix) = match line.origin() {
                '+' => ("addition", "+"),
                '-' => ("deletion", "-"),
                'B' => ("context", " "),
                _ => ("context", " "),
            };

            diff_html.push_str(&format!(
                "<span class=\"{}\">{}{}&#8203;</span>\n",
                class,
                prefix,
                html_escape(content)
            ));
        }
        true
    })
    .map_err(|e| format!("Failed to parse diff content to text format: {e}"))?;

    if in_hunk {
        diff_html.push_str("</pre>");
    }
    diff_html.push_str("</div>");

    Ok(diff_html)
}

/// Escapes characters and expressions to html safe ones
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
