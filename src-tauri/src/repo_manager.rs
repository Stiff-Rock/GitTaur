use crate::{config_manager::config, types::repo_guard::RepoGuard};
use auth_git2_pem::GitAuthenticator;
use git2::{
    build::CheckoutBuilder, BranchType, IndexAddOption, Oid, Progress, Repository, Signature,
};
use log::{error, info};
use std::{
    collections::HashMap,
    num::TryFromIntError,
    path::Path,
    sync::{LazyLock, Mutex},
    time::{Duration, Instant},
};
use tauri::{command, AppHandle, Emitter};
use tauri_plugin_shell::{self, ShellExt};

//NOTE: GitAuthenticator::set_prompter()

static LAST_UPDATE: LazyLock<Mutex<Instant>> = LazyLock::new(|| {
    Mutex::new(
        Instant::now()
            .checked_sub(Duration::from_secs(1))
            .unwrap_or(Instant::now()),
    )
});

pub fn live_update_transfer<'a>(
    app_handle: AppHandle,
    title: String,
) -> Option<impl FnMut(Progress<'_>) -> bool + 'a> {
    Some(move |stats: Progress<'_>| {
        let now = Instant::now();

        let should_update = {
            let mut last = LAST_UPDATE.lock().unwrap();
            let should_update = now.duration_since(*last) >= Duration::from_millis(250)
                || (stats.received_objects() == stats.total_objects() && stats.total_objects() > 0);

            if should_update {
                *last = now;
            }

            should_update
        };

        if should_update {
            let progress_msg = if stats.total_objects() > 0 {
                format!(
                    "{}: {:.2}% ({}/{}) - {:.2} KiB",
                    title,
                    (stats.received_objects() as f32 / stats.total_objects() as f32) * 100.0,
                    stats.received_objects(),
                    stats.total_objects(),
                    stats.received_bytes() as f32 / 1024.0
                )
            } else {
                format!("{}: Preparing to receive objects...", title)
            };

            let _ = app_handle.emit("operation-progress", &progress_msg);
        }

        true
    })
}

pub fn live_update_push<'a>(
    app_handle: AppHandle,
    title: String,
) -> Option<impl FnMut(usize, usize, usize) + 'a> {
    Some(move |current, total, bytes| {
        let now = Instant::now();

        // Same debouncing logic as live_update_transfer
        let should_update = {
            let mut last = LAST_UPDATE.lock().unwrap();
            let should_update = now.duration_since(*last) >= Duration::from_millis(250)
                || (current == total && total > 0);

            if should_update {
                *last = now;
            }

            should_update
        };

        if should_update {
            let progress_msg = if total > 0 {
                format!(
                    "{}: {:.2}% ({}/{}) - {:.2} KiB",
                    title,
                    (current as f32 / total as f32) * 100.0,
                    current,
                    total,
                    bytes as f32 / 1024.0
                )
            } else {
                format!("{}: Preparing to send objects...", title)
            };

            let _ = app_handle.emit("operation-progress", &progress_msg);
        }
    })
}

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
    let git2_clone_result = auth.clone_repo(
        &repo_url,
        &clone_path,
        live_update_transfer(app_handle.clone(), "Receiving objects".to_string()),
    );

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

#[command]
pub async fn tag_branch_tip(
    repo_path: String,
    branch_name: String,
    tag_name: String,
    tag_msg: String,
    is_local: bool,
) -> Result<(), String> {
    info!("Creating tag {tag_name} for <{branch_name}> branch tip in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let branch_type = if is_local {
        BranchType::Local
    } else {
        BranchType::Remote
    };

    let branch = repo
        .find_branch(&branch_name, branch_type)
        .map_err(|e| format!("Could not find branch {branch_name} in repository: {e}"))?;

    let reference = branch.get();

    let oid = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Branch has no target"))
        .map_err(|e| format!("Unable to get id of branch reference: {e}"))?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    create_tag(repo, oid, tag_name, tag_msg)
}

#[command]
pub async fn tag_commit(
    repo_path: String,
    commit_oid: String,
    tag_name: String,
    tag_msg: String,
) -> Result<(), String> {
    info!("Creating tag <{tag_name}> in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let oid = Oid::from_str(&commit_oid)
        .map_err(|e| format!("Could not parse string as commit id: {e}"))?;

    create_tag(repo, oid, tag_name, tag_msg)
}

fn create_tag(
    repo: Repository,
    commit_oid: Oid,
    tag_name: String,
    tag_msg: String,
) -> Result<(), String> {
    let commit = repo
        .find_commit(commit_oid)
        .map_err(|e| format!("Could not find commit on repository: {e}"))?;

    let signature = repo
        .signature()
        .map_err(|e| format!("Could not find signature for tagging on repository: {e}"))?;

    if tag_msg.is_empty() {
        repo.tag_lightweight(&tag_name, &commit.into_object(), false)
            .map_err(|e| format!("Failed to create lightweight tag: {e}"))?;
    } else {
        repo.tag(
            &tag_name,
            &commit.into_object(),
            &signature,
            &tag_msg,
            false,
        )
        .map_err(|e| format!("Failed to create annotated tag: {e}"))?;
    }

    Ok(())
}

#[command]
pub async fn delete_tag(repo_path: String, tag_name: String) -> Result<(), String> {
    info!("Deleting tag {} from repository at {}", tag_name, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    repo.tag_delete(&tag_name)
        .map_err(|e| format!("Failed to delete tag: {e}"))?;

    Ok(())
}

#[command]
pub async fn checkout_commit(
    app_handle: AppHandle,
    repo_path: String,
    commit_oid: String,
) -> Result<(), String> {
    info!("Checking out to commit in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["checkout", &commit_oid])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git checkout command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error performing checkout - {}", stderr));
    }

    Ok(())
}

#[command]
pub async fn checkout_branch(repo_path: String, branch_name: String) -> Result<(), String> {
    info!("Checking out to branch in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let branch = repo
        .find_branch(&branch_name, BranchType::Local)
        .or_else(|_| repo.find_branch(&branch_name, git2::BranchType::Remote))
        .map_err(|e| format!("Could not find branch {branch_name} in repository: {e}"))?;

    let reference = branch.get();

    let oid = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Branch has no target"))
        .map_err(|e| format!("Could not get id of the branch reference: {e}"))?;

    let commit = repo
        .find_commit(oid)
        .map_err(|e| format!("Could not find commit in repository: {e}"))?;
    let object = commit.as_object();

    let mut checkout_builder = CheckoutBuilder::new();
    repo.checkout_tree(&object, Some(&mut checkout_builder))
        .map_err(|e| format!("Failed to checkout tree: {e}"))?;

    let branch_ref_name = reference
        .name()
        .ok_or_else(|| "Invalid branch reference name".to_string())?;

    repo.set_head(branch_ref_name)
        .map_err(|e| format!("Failed to set head to the new target: {e}"))?;

    Ok(())
}

#[command]
pub async fn rename_branch(
    repo_path: String,
    old_branch_name: String,
    new_branch_name: String,
) -> Result<(), String> {
    info!("Renaming branch from {old_branch_name} to {new_branch_name} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut branch = repo
        .find_branch(&old_branch_name, BranchType::Local)
        .map_err(|e| format!("Could not find branch {old_branch_name} in repository: {e}"))?;

    branch.rename(&new_branch_name, false).map_err(|e| {
        format!("Failed to rename branch <{old_branch_name}> to <{new_branch_name}>: {e}")
    })?;

    Ok(())
}

#[command]
pub async fn delete_branch(
    repo_path: String,
    branch_name: String,
    is_local: bool,
) -> Result<(), String> {
    info!("Deleting branch {branch_name} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let branch_type = if is_local {
        BranchType::Local
    } else {
        BranchType::Remote
    };

    let mut branch = repo
        .find_branch(&branch_name, branch_type)
        .map_err(|e| format!("Could not find branch {branch_name} in repository: {e}"))?;

    branch
        .delete()
        .map_err(|e| format!("Failed to delete branch <{branch_name}>: {e}"))?;

    Ok(())
}

#[command]
pub async fn add_to_staging_area(repo_path: String, files: Vec<String>) -> Result<(), String> {
    info!("Staging {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut index = repo
        .index()
        .map_err(|e| format!("Could not get index reference of repository: {e}"))?;

    if files.is_empty() {
        index
            .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
            .map_err(|e| format!("Failed to add all changes to the staging area: {e}"))?;
    } else {
        for file in &files {
            let file_path = Path::new(&repo_path).join(file);

            if file_path.exists() {
                index.add_path(Path::new(file)).map_err(|e| {
                    format!(
                        "Failed to add file <{:#?}> to staging area: {}",
                        file_path, e
                    )
                })?;
            } else {
                index.remove_path(Path::new(file)).map_err(|e| {
                    format!(
                        "Failed to add file <{:#?}> to staging area: {}",
                        file_path, e
                    )
                })?;
            }
        }
    }

    index
        .write()
        .map_err(|e| format!("Failed to add file/s to staging area: {e}"))?;

    Ok(())
}

#[command]
pub async fn remove_from_staging_area(repo_path: String, files: Vec<String>) -> Result<(), String> {
    info!("Unstaging {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut index = repo
        .index()
        .map_err(|e| format!("Could not get the current index of the repository: {e}"))?;

    if files.is_empty() {
        let is_empty = repo
            .is_empty()
            .map_err(|e| format!("Could not determine if repository is empty: {e}"))?;

        if is_empty {
            index
                .clear()
                .map_err(|e| format!("Failed to clear the index: {e}"))?;
        } else {
            let head = repo
                .head()
                .map_err(|e| format!("Could not get the head of the repository: {e}"))?;
            let obj = head
                .peel(git2::ObjectType::Tree)
                .map_err(|e| format!("Could not get the tree reference of head: {e}"))?;
            let tree = obj.as_tree().ok_or("Could not find tree")?;

            index
                .read_tree(&tree)
                .map_err(|e| format!("Failed to read tree: {e}"))?;
        }
    } else {
        if let Ok(head) = repo.head() {
            let head_commit = head
                .peel_to_commit()
                .map_err(|e| format!("Could not obtain head commit: {e}"))?;

            for file in &files {
                let commit_obj = head_commit.as_object();

                repo.reset_default(Some(commit_obj), &[Path::new(&file)])
                    .map_err(|e| format!("Filed to remove files from staging area: {e}"))?;
            }
        } else {
            for file in &files {
                let file_path = Path::new(file);
                index.remove_path(file_path).map_err(|e| {
                    format!(
                        "Failed to remove file <{:#?}> from staging area: {}",
                        file_path, e
                    )
                })?;
            }
        }
    }

    index
        .write()
        .map_err(|e| format!("Failed to remove file/s to staging area: {e}"))?;

    Ok(())
}

#[command]
pub async fn discard_changes(repo_path: String, files: Vec<String>) -> Result<(), String> {
    info!("Discarding {:#?} in repo {}", files, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let head = repo
        .head()
        .map_err(|e| format!("Could not get head of repository: {e}"))?;
    let commit = head
        .peel_to_commit()
        .map_err(|e| format!("Could not get head commit: {e}"))?;
    let tree = commit
        .tree()
        .map_err(|e| format!("Could not get tree of head commit: {e}"))?;

    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(true);
    let statuses = repo
        .statuses(Some(&mut status_opts))
        .map_err(|e| format!("Could not get statuses of changes of the repository: {e}"))?;

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
                std::fs::remove_file(&full_path).map_err(|e| {
                    format!("Failed no remove file change <{:#?}>: {}", full_path, e)
                })?;
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

#[command]
pub async fn stash_changes(
    app_handle: AppHandle,
    repo_path: String,
    stash_msg: String,
    files: Vec<String>,
    include_untracked: bool,
) -> Result<(), String> {
    info!("Stashing changes in repo {repo_path} with msg {stash_msg}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let mut command = shell.command("git").args(["stash", "push"]);

    if include_untracked {
        command = command.arg("--include-untracked"); // or "-u" for short
    }

    if !stash_msg.is_empty() {
        command = command.args(["-m", &stash_msg]);
    }

    for file_path in files {
        command = command.arg(file_path);
    }

    let output = command
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git stash command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);

        return Err(format!("Error stashing - {}", stderr));
    }

    Ok(())
}

#[command]
pub async fn apply_stash(
    app_handle: AppHandle,
    repo_path: String,
    index: i64,
) -> Result<(), String> {
    info!("Applying stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["stash", "apply", &format!("stash@{{{index}}}")])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git stash apply command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error applying stash - {}", stderr));
    }

    Ok(())
}

#[command]
pub async fn drop_stash(repo_path: String, index: i64) -> Result<(), String> {
    info!("Dropping stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let mut repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let index = index
        .try_into()
        .map_err(|e: TryFromIntError| format!(": {e}"))?;

    repo.stash_drop(index)
        .map_err(|e| format!("Failed to drop stash: {e}"))?;

    Ok(())
}

#[command]
pub async fn pop_stash(app_handle: AppHandle, repo_path: String, index: i64) -> Result<(), String> {
    info!("Popping stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["stash", "pop", &format!("stash@{{{index}}}")])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git stash pop command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error applying stash pop - {}", stderr));
    }

    Ok(())
}

#[command]
pub async fn add_remote(
    repo_path: String,
    remote_name: String,
    remote_url: String,
) -> Result<(), String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    repo.remote(&remote_name, &remote_url)
        .map_err(|e| format!("Failed to add remote: {e}"))?;

    Ok(())
}

#[command]
pub async fn delete_remote(repo_path: String, remote_name: String) -> Result<(), String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    repo.remote_delete(&remote_name)
        .map_err(|e| format!("Failed to delete repository: {e}"))?;

    Ok(())
}

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
            let repo = Repository::open(&repo_path)
                .map_err(|e| format!("Failed to open repository: {e}"))?;
            get_remote_refs(&repo, remote_name)?
        };

        let git2_fetch_success = {
            let repo = Repository::open(&repo_path)
                .map_err(|e| format!("Failed to open repository: {e}"))?;
            let mut remote = repo
                .find_remote(remote_name)
                .map_err(|e| format!("Could not find remote {remote_name} in repository: {e}"))?;
            let refspecs = &[] as &[&str];
            let auth = GitAuthenticator::new();

            match auth.fetch(
                &repo,
                &mut remote,
                refspecs,
                None,
                live_update_transfer(app_handle.clone(), format!("Fetching \"{remote_name}\"")),
            ) {
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
                .current_dir(&repo_path)
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
            let repo = Repository::open(&repo_path)
                .map_err(|e| format!("Failed to open repository: {e}"))?;
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

    let references = repo
        .references()
        .map_err(|e| format!("Could not get references of repository: {e}"))?;
    for reference_result in references {
        let reference = if reference_result.is_ok() {
            reference_result.expect("Error obtaining repository refs")
        } else {
            continue;
        };

        if let Some(name) = reference.name() {
            if name.starts_with(&remote_prefix) {
                if let Some(target) = reference.target() {
                    refs.insert(target.to_string(), target);
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

#[command]
pub async fn pull_remote(
    app_handle: AppHandle,
    repo_path: String,
    remote_name: String,
    branch: String,
) -> Result<String, String> {
    info!(
        "Pulling from remote {} of repository at {}",
        remote_name, repo_path
    );

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let args = if branch.is_empty() {
        vec!["pull", &remote_name]
    } else {
        vec!["pull", &remote_name, &branch]
    };

    let output = shell
        .command("git")
        .args(&args)
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git pull command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);

        return Err(format!("Error pulling - {}", stderr));
    }

    Ok("Successfully pulled changes".to_string())
}

#[command]
pub async fn push_remote(
    app_handle: AppHandle,
    repo_path: String,
    remote_name: String,
    local_branch: String,
    remote_branch: String,
    force_push: bool,
) -> Result<String, String> {
    info!(
        "Pushing changes to remote {} of repository at {}",
        remote_name, repo_path
    );

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let refspec = format!("refs/heads/{}:refs/heads/{}", local_branch, remote_branch);

    let push_result = {
        let repo =
            Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

        let mut remote = repo
            .find_remote(&remote_name)
            .map_err(|e| format!("Failed to find remote \"{remote_name}\" in repository: {e}"))?;

        // Add "+" prefix to refspec if force_push is true
        let refspec = if force_push {
            format!("+refs/heads/{}:refs/heads/{}", local_branch, remote_branch)
        } else {
            format!("refs/heads/{}:refs/heads/{}", local_branch, remote_branch)
        };

        let auth = GitAuthenticator::new();
        auth.push(
            &repo,
            &mut remote,
            &[&refspec],
            live_update_push(app_handle.clone(), format!("Pushing to {remote_name}")),
        )
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
            .current_dir(&repo_path)
            .output()
            .await
            .map_err(|e| format!("Failed to execute git push command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);

            return Err(format!("Error pushing to remote - {}", stderr));
        }
    }

    Ok("Successfully pushed changes".to_string())
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

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let head = repo
        .head()
        .map_err(|e| format!("Could not obtain head of repository: {e}"))?;
    let commit = head
        .peel_to_commit()
        .map_err(|e| format!("Could not obtain head commit: {e}"))?;

    let branch_ref = repo
        .branch(&branch_name, &commit, false)
        .map_err(|e| format!("Could not create new branch \"{branch_name}\": {e}"))?;

    if checkout {
        let branch_ref = branch_ref
            .get()
            .name()
            .ok_or("Invalid branch name")?
            .to_string();

        let mut checkout_builder = CheckoutBuilder::new();

        repo.set_head(&branch_ref)
            .map_err(|e| format!("Could not set head to new branch: {e}"))?;
        repo.checkout_head(Some(&mut checkout_builder))
            .map_err(|e| format!("Failed to checkout to new head while creating branch: {e}"))?;
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

    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;

    let mut index = repo
        .index()
        .map_err(|e| format!("Could not obtain index of repository: {e}"))?;

    let config = config()?;
    let signature = Signature::now(&config.username, &config.email)
        .map_err(|e| format!("Could not get signature in repository: {e}"))?;

    let message = if commit_body.trim().is_empty() {
        commit_summary.to_string()
    } else {
        format!("{}\n\n{}", commit_summary, commit_body)
    };

    let tree_id = index
        .write_tree()
        .map_err(|e| format!("Failed to write tree to index: {e}"))?;
    let tree = repo
        .find_tree(tree_id)
        .map_err(|e| format!("Failed to find written tree on repository: {e}"))?;

    let parents = match repo.head() {
        Ok(head) => {
            if let Some(oid) = head.target() {
                vec![repo
                    .find_commit(oid)
                    .map_err(|e| format!("Failed to find head commit: {e}"))?]
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
    .map_err(|e| format!("Failed to create commit: {e}"))?;

    Ok(())
}

#[command]
pub async fn revert_commit(
    app_handle: AppHandle,
    repo_path: String,
    commit_oid: String,
    is_merge_commit: bool,
) -> Result<(), String> {
    info!("Reverting commit in repository at {}", repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let mut command = shell.command("git").arg("revert");

    if is_merge_commit {
        command = command.args(["-m", "1"]);
    }

    command = command.arg(&commit_oid);

    let output = command
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git revert command: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);

    if !output.status.success()
        || stdout.contains("nothing to commit")
        || stdout.contains("detached HEAD")
        || stderr.contains("error:")
    {
        let error_message = if stderr.is_empty() {
            format!("Revert failed: {}", stdout.trim())
        } else {
            format!("Error reverting: {}", stderr.trim())
        };

        return Err(error_message);
    }

    Ok(())
}

#[command]
pub async fn merge_branch(
    app_handle: AppHandle,
    repo_path: String,
    source_branch: String,
    target_branch: String,
) -> Result<String, String> {
    info!("Merging branch {source_branch} into {target_branch} in repository at {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["merge", &source_branch])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git merge command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);

        return Err(format!("Error merging - {}", stderr));
    }

    Ok(format!(
        "Successfully merged {source_branch} into {target_branch}"
    ))
}

#[command]
pub async fn rebase_branch(
    app_handle: AppHandle,
    repo_path: String,
    source_branch: String,
    target_branch: String,
) -> Result<String, String> {
    info!("Rebasing branch {source_branch} onto {target_branch} in repository at {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["rebase", &source_branch])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git rebase command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);

        return Err(format!("Error rebasing - {}", stderr));
    }

    Ok(format!(
        "Successfully rebased {source_branch} into {target_branch}"
    ))
}
