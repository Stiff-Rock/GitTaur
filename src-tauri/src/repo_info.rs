use std::collections::HashMap;

use indexmap::IndexMap;
use serde::Serialize;

use crate::git2json::{CommitLog, FileChanges};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfo {
    pub name: String,
    pub main_branch: String,
    pub current_branch: String,
    pub local_branches: Vec<String>,
    pub remotes: HashMap<String, Vec<String>>,
    pub tags: Vec<String>,
    pub commit_history: IndexMap<String, CommitLog>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoStatus {
    pub unstaged_files: Vec<FileChanges>,
    pub staged_files: Vec<FileChanges>,
}
