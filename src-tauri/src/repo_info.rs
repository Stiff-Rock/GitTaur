use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
pub struct FileChange {
    pub file: String,
    pub change_type: String,
    pub patch: String,
}

#[derive(Serialize)]
pub struct CommitInfo {
    pub sha: String,
    pub subject: String,
    pub body: String,
    pub author: String,
    pub email: String,
    pub commit_date: String,
    pub parents: Vec<String>,
}

#[derive(Serialize)]
pub struct RepoInfo {
    pub name: String,
    pub current_branch: String,
    pub local_branches: Vec<String>,
    pub remotes: Vec<String>,
    pub tags: Vec<String>,
    pub commits: HashMap<String, CommitInfo>,
}

impl RepoInfo {
    pub fn new(
        name: String,
        current_branch: String,
        local_branches: Vec<String>,
        remotes: Vec<String>,
        tags: Vec<String>,
        commits: HashMap<String, CommitInfo>,
    ) -> Self {
        RepoInfo {
            name,
            current_branch,
            local_branches,
            remotes,
            tags,
            commits,
        }
    }
}
