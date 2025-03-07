use serde::Serialize;

#[derive(Serialize)]
pub struct CommitInfo {
    pub sha: String,
    pub subject: String,
    pub body: String,
    pub author: String,
    pub commit_date: String,
}

#[derive(Serialize)]
pub struct RepoInfo {
    pub name: String,
    pub current_branch: String,
    pub commits: Vec<CommitInfo>,
}

impl RepoInfo {
    pub fn new(name: String, current_branch: String, commits: Vec<CommitInfo>) -> Self {
        RepoInfo {
            name,
            current_branch,
            commits,
        }
    }
}
