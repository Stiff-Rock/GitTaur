use crate::repo_info::{CommitInfo, FileChange, RepoInfo};
use chrono::DateTime;
use git2::{BranchType, Commit, DiffOptions, Repository};
use indexmap::IndexMap;
use std::collections::HashMap;
use std::sync::{Mutex, MutexGuard};

pub struct RepoManager {
    pub repos: Mutex<HashMap<String, Repository>>,
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            repos: Mutex::new(HashMap::new()),
        }
    }

    pub fn try_lock_repos(&self) -> Result<MutexGuard<HashMap<String, Repository>>, String> {
        self.repos
            .try_lock()
            .map_err(|_| "Another operation is currently in progress".into())
    }

    pub fn get_repo_info(
        &self,
        path: &str,
        repos_guard: &MutexGuard<HashMap<String, Repository>>,
    ) -> Result<RepoInfo, String> {
        if let Some(repo) = repos_guard.get(path) {
            let name = path.to_string();

            let current_branch = match repo.head() {
                Ok(head) => head.name().unwrap_or("Unknown").to_string(),
                Err(_) => "Unknown".to_string(),
            };

            let local_branches = repo
                .branches(Some(git2::BranchType::Local))
                .map_err(|e| e.to_string())?
                .filter_map(|b| b.ok())
                .filter_map(|(b, _)| b.name().ok().flatten().map(|s| s.to_owned()))
                .collect::<Vec<String>>();

            let remotes: HashMap<String, Vec<String>> = Self::get_remote_branches(repo)?;

            let tags = repo
                .tag_names(None)
                .map_err(|e| e.to_string())?
                .iter()
                .filter_map(|t| t.map(|s| s.to_string()))
                .collect::<Vec<String>>();

            let commits = Self::get_commits(repo)?;

            let repo = RepoInfo::new(name, current_branch, local_branches, remotes, tags, commits);
            println!("{}", serde_json::to_string_pretty(&repo).unwrap());
            Ok(repo)
        } else {
            Err("Repository not found".to_string())
        }
    }

    fn get_remote_branches(repo: &Repository) -> Result<HashMap<String, Vec<String>>, String> {
        let remote_branches = repo
            .branches(Some(BranchType::Remote))
            .map_err(|e| e.to_string())?;

        let mut remote_branches_map: HashMap<String, Vec<String>> = HashMap::new();
        for branch_entry in remote_branches {
            let (branch, _branch_type) = branch_entry.map_err(|e| e.to_string())?;
            let branch_name = branch
                .name()
                .map_err(|e| e.to_string())?
                .unwrap_or_else(|| {
                    eprintln!(
                        "Warning: Invalid branch name in entry {:?}",
                        branch.name_bytes()
                    );
                    "(invalid)"
                });

            if let Some(stripped) = branch_name.strip_prefix("refs/remotes/") {
                if let Some((remote, name)) = stripped.split_once('/') {
                    remote_branches_map
                        .entry(remote.to_string())
                        .or_default()
                        .push(name.to_string());
                }
            }
        }

        Ok(remote_branches_map)
    }

    fn get_commits(repo: &Repository) -> Result<IndexMap<String, CommitInfo>, String> {
        let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
        revwalk.push_head().map_err(|e| e.to_string())?;

        let mut commits = IndexMap::new();

        for oid_result in revwalk {
            let oid = oid_result.map_err(|e| e.to_string())?;
            let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

            let commit_msg = commit.message().unwrap_or("No commit message");
            let (msg_subject, msg_body) = commit_msg
                .split_once("\n\n")
                .map(|(s, b)| (s.trim(), b.trim()))
                .unwrap_or_else(|| (commit_msg.trim(), ""));

            let msg_subject = msg_subject.to_string();
            let msg_body = msg_body.to_string();

            let commit_time = commit.time();
            let timestamp = commit_time.seconds();
            let date_time = DateTime::from_timestamp(timestamp, 0)
                .ok_or_else(|| "Invalid timestamp".to_string())?;
            let formatted_date = date_time.format("%d/%m/%Y").to_string();

            let mut parents = Vec::new();
            for i in 0..commit.parent_count() {
                let parent = commit.parent(i).map_err(|e| e.to_string())?;
                parents.push(parent.id().to_string());
            }

            let sha = commit.id().to_string();
            let branches = Self::get_commit_branches(repo, oid).map_err(|e| e.to_string())?;
            let commit_info = CommitInfo {
                sha: sha.clone(),
                branches,
                subject: msg_subject,
                body: msg_body,
                author: commit.author().name().unwrap_or("Unknown").to_string(),
                email: commit.author().email().unwrap_or("Unknown").to_string(),
                commit_date: formatted_date,
                parents,
            };

            commits.insert(sha, commit_info);
        }

        Ok(commits)
    }

    pub fn get_commit_changes(
        repo: &Repository,
        commit: &Commit,
    ) -> Result<Vec<FileChange>, git2::Error> {
        let commit_tree = commit.tree()?;
        let parent_commit = commit.parent(0).ok();
        let parent_tree = parent_commit
            .and_then(|c| c.tree().ok())
            .unwrap_or_else(|| {
                let tree_oid = repo.treebuilder(None).unwrap().write().unwrap();
                repo.find_tree(tree_oid).unwrap()
            });

        let mut diff_opts = DiffOptions::new();
        diff_opts.context_lines(3).show_binary(true);

        let diff =
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), Some(&mut diff_opts))?;

        let mut changes = Vec::new();

        diff.foreach(
            &mut |delta, _| {
                let old_path = delta
                    .old_file()
                    .path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_default();
                let new_path = delta
                    .new_file()
                    .path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_default();
                let change_type = format!("{:?}", delta.status());

                let file = if delta.status() == git2::Delta::Deleted {
                    old_path
                } else {
                    new_path
                };

                let patch = {
                    let blob = repo.find_blob(delta.new_file().id()).ok();
                    match blob {
                        Some(b) => String::from_utf8(b.content().to_vec()).unwrap_or_default(),
                        None => String::new(),
                    }
                };

                changes.push(FileChange {
                    file,
                    change_type,
                    patch,
                });

                true
            },
            None,
            None,
            None,
        )?;

        Ok(changes)
    }
}
