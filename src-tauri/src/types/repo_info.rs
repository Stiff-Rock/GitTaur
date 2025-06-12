use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfo {
    pub name: String,
    pub current_branch: String,
    pub local_branches: Vec<String>,
    pub remotes: HashMap<String, Remote>,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoHistory {
    pub commit_history_map: IndexMap<String, Commit>,
    pub head_is_detached: bool,
    pub current_commit_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub id: String,
    pub parents: Vec<String>,
    pub children: Vec<String>,
    pub author: UserInfo,
    pub date: String,
    pub subject: String,
    pub body: String,
    pub refs: Vec<String>,
    pub changes: Vec<FileChanges>,
    pub is_from_main_branch: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub name: String,
    pub email: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChanges {
    pub change_type: ChangeType,
    pub file: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Deleted,
    Modified,
    Added,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Remote {
    pub name: String,
    pub url: String,
    pub branches: Vec<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoStatus {
    pub unstaged_files: Vec<FileChanges>,
    pub staged_files: Vec<FileChanges>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Stash {
    pub id: String,
    pub index: i64,
    pub name: String,
    pub timestamp: i64,
    pub contents: Vec<FileChanges>,
}
