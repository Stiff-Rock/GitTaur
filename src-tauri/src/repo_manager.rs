use crate::repo_info::{CommitInfo, RepoInfo};
use chrono::DateTime;
use git2::Repository;
use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::MutexGuard;

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

            let remotes = repo
                .remotes()
                .map_err(|e| e.to_string())?
                .iter()
                .filter_map(|r| r.map(|s| s.to_string()))
                .collect::<Vec<String>>();

            let tags = repo
                .tag_names(None)
                .map_err(|e| e.to_string())?
                .iter()
                .filter_map(|t| t.map(|s| s.to_string()))
                .collect::<Vec<String>>();

            let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
            revwalk.push_head().map_err(|e| e.to_string())?;
            let mut commits = Vec::new();
            for oid in revwalk {
                let oid = oid.map_err(|e| e.to_string())?;
                let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

                // Gets the commit message
                let commit_msg = commit.message().unwrap_or("No commit message");
                let (msg_subject, msg_body) = commit_msg
                    .split_once("\n\n")
                    .map(|(s, b)| (s.trim(), b.trim()))
                    .unwrap_or_else(|| (commit_msg.trim(), ""));

                let msg_subject = msg_subject.to_string();
                let msg_body = msg_body.to_string();

                // Gets the commit date time
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

                // Create ComitInfo object
                let commit_info = CommitInfo {
                    sha: commit.id().to_string(),
                    subject: msg_subject,
                    body: msg_body,
                    author: commit.author().name().unwrap_or("Unknown").to_string(),
                    commit_date: formatted_date,
                    parents,
                };

                commits.push(commit_info);
            }

            Ok(RepoInfo::new(
                name,
                current_branch,
                local_branches,
                remotes,
                tags,
                commits,
            ))
        } else {
            Err("Repository not found".to_string())
        }
    }
}
