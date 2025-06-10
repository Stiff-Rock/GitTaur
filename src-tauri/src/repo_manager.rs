use crate::{config_manager::config, types::repo_guard::RepoGuard};
use auth_git2_pem::GitAuthenticator;
use git2::{
    build::CheckoutBuilder, BranchType, IndexAddOption, Oid, Repository, Signature,
    StashApplyOptions, StashFlags,
};
use log::{error, info};
use std::{collections::HashMap, num::TryFromIntError, path::Path};
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

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let branch_type = if is_local {
        BranchType::Local
    } else {
        BranchType::Remote
    };

    let branch = repo
        .find_branch(&branch_name, branch_type)
        .map_err(|e| e.to_string())?;

    let reference = branch.get();

    let oid = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Branch has no target"))
        .map_err(|e| e.to_string())?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    create_tag(repo, oid, tag_name, tag_msg)
}

#[command]
pub async fn tag_commit(
    repo_path: String,
    commit_oid: String,
    tag_name: String,
    tag_msg: String,
) -> Result<(), String> {
    info!("Creating tag {tag_name} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let oid = Oid::from_str(&commit_oid).map_err(|e| e.to_string())?;

    create_tag(repo, oid, tag_name, tag_msg)
}

fn create_tag(
    repo: Repository,
    commit_oid: Oid,
    tag_name: String,
    tag_msg: String,
) -> Result<(), String> {
    let commit = repo.find_commit(commit_oid).map_err(|e| e.to_string())?;

    let signature = repo.signature().map_err(|e| e.to_string())?;

    if tag_msg.is_empty() {
        repo.tag_lightweight(&tag_name, &commit.into_object(), false)
            .map_err(|e| e.to_string())?;
    } else {
        repo.tag(
            &tag_name,
            &commit.into_object(),
            &signature,
            &tag_msg,
            false,
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[command]
pub async fn delete_tag(repo_path: String, tag_name: String) -> Result<(), String> {
    info!("Deleting tag {} from repository at {}", tag_name, repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    repo.tag_delete(&tag_name).map_err(|e| e.to_string())?;

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
        .args(["stash"])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git stash command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error creating stash before checkout - {}", stderr));
    }

    {
        let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

        let oid = Oid::from_str(commit_oid.as_str()).map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
        let object = commit.as_object();

        let mut checkout_builder = CheckoutBuilder::new();
        repo.checkout_tree(&object, Some(&mut checkout_builder))
            .map_err(|e| e.to_string())?;

        repo.set_head_detached(oid).map_err(|e| e.to_string())?;
    }

    let output = shell
        .command("git")
        .args(["stash", "pop"])
        .current_dir(&repo_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute git stash pop command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error doing stash pop after checkout - {}", stderr));
    }

    Ok(())
}

#[command]
pub async fn checkout_branch(repo_path: String, branch_name: String) -> Result<(), String> {
    info!("Checking out to branch in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let branch = repo
        .find_branch(&branch_name, BranchType::Local)
        .or_else(|_| repo.find_branch(&branch_name, git2::BranchType::Remote))
        .map_err(|e| e.to_string())?;

    let reference = branch.get();

    let oid = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Branch has no target"))
        .map_err(|e| e.to_string())?;

    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
    let object = commit.as_object();

    let mut checkout_builder = CheckoutBuilder::new();
    repo.checkout_tree(&object, Some(&mut checkout_builder))
        .map_err(|e| e.to_string())?;

    let branch_ref_name = reference
        .name()
        .ok_or_else(|| "Invalid branch reference name".to_string())?;

    repo.set_head(branch_ref_name).map_err(|e| e.to_string())?;

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

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let mut branch = repo
        .find_branch(&old_branch_name, BranchType::Local)
        .map_err(|e| e.to_string())?;

    branch
        .rename(&new_branch_name, false)
        .map_err(|e| e.to_string())?;

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

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let branch_type = if is_local {
        BranchType::Local
    } else {
        BranchType::Remote
    };

    let mut branch = repo
        .find_branch(&branch_name, branch_type)
        .map_err(|e| e.to_string())?;

    branch.delete().map_err(|e| e.to_string())?;

    Ok(())
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

//TODO: STASH WITH GIT COMMANDS
#[command]
pub async fn stash_changes(
    repo_path: String,
    stash_msg: String,
    files: Vec<String>,
) -> Result<(), String> {
    info!("Stashing changes in repo {repo_path} with msg {stash_msg}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;
    let mut repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let signature = repo.signature().map_err(|e| e.to_string())?;

    let mut opts = git2::StashSaveOptions::new(signature);
    opts.flags(Some(StashFlags::INCLUDE_UNTRACKED));
    for file in &files {
        opts.pathspec(file);
    }

    let _stash_oid = repo
        .stash_save_ext(Some(&mut opts))
        .map_err(|e| e.to_string())?;

    /*
        if !stash_msg.is_empty() {
            let stash_commit = repo.find_commit(stash_oid).map_err(|e| e.to_string())?;

            stash_commit
                .amend(
                    Some("refs/stash"),
                    Some(&stash_commit.author()),
                    Some(&stash_commit.committer()),
                    stash_commit.message_encoding(),
                    Some(stash_msg.as_str()),
                    Some(&stash_commit.tree().map_err(|e| e.to_string())?),
                )
                .map_err(|e| e.to_string())?;

            info!("Amended stash commit with message: {stash_msg}");
        }
    */

    Ok(())
}

//TODO: APPLY WITH GIT COMMANDS
#[command]
pub async fn apply_stash(repo_path: String, index: i64) -> Result<(), String> {
    info!("Applying stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;
    let mut repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let index = index
        .try_into()
        .map_err(|e: TryFromIntError| e.to_string())?;

    let mut opts = StashApplyOptions::new();
    repo.stash_apply(index, Some(&mut opts))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn drop_stash(repo_path: String, index: i64) -> Result<(), String> {
    info!("Dropping stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;
    let mut repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let index = index
        .try_into()
        .map_err(|e: TryFromIntError| e.to_string())?;

    repo.stash_drop(index).map_err(|e| e.to_string())?;

    Ok(())
}

//TODO: POP WITH GIT COMMANDS
#[command]
pub async fn pop_stash(repo_path: String, index: i64) -> Result<(), String> {
    info!("Popping stash with index {index} in repo {repo_path}");

    let _repo_lock = RepoGuard::new(&repo_path, false)?;
    let mut repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let index = index
        .try_into()
        .map_err(|e: TryFromIntError| e.to_string())?;

    let mut opts = StashApplyOptions::new();
    repo.stash_pop(index, Some(&mut opts))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn add_remote(
    repo_path: String,
    remote_name: String,
    remote_url: String,
) -> Result<(), String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    repo.remote(&remote_name, &remote_url)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn delete_remote(repo_path: String, remote_name: String) -> Result<(), String> {
    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    repo.remote_delete(&remote_name)
        .map_err(|e| e.to_string())?;

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
        .args(args)
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

//TODO: Live loading feedback
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

    let config = config()?;
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

#[command]
pub async fn revert_commit(
    app_handle: AppHandle,
    repo_path: String,
    commit_oid: String,
) -> Result<(), String> {
    info!("Reverting commit in repository at {}", repo_path);

    let _repo_lock = RepoGuard::new(&repo_path, false)?;

    let shell = app_handle.shell();

    let output = shell
        .command("git")
        .args(["revert", &commit_oid])
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
