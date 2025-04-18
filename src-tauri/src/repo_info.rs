use std::collections::HashMap;

use indexmap::IndexMap;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct FileChange {
    pub file: String,
    pub change_type: String,
    pub patch: String,
}

#[derive(Serialize, Debug)]
pub struct CommitNode {
    pub sha: String,
    pub branch: String,
    pub refs: Vec<String>,
    pub subject: String,
    pub body: String,
    pub author: String,
    pub email: String,
    pub commit_date: String,
    pub parents: Vec<String>,
}

#[derive(Serialize, Debug)]
pub struct RepoInfo {
    pub name: String,
    pub main_branch: String,
    pub current_branch: String,
    pub local_branches: Vec<String>,
    pub remotes: HashMap<String, Vec<String>>,
    pub tags: Vec<String>,
    pub commit_history: IndexMap<String, CommitNode>,
}
