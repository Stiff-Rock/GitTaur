use crate::git2json::FileChanges;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfo {
    pub name: String,
    pub main_branch: String,
    pub current_branch: String,
    pub local_branches: Vec<String>,
    pub remotes: HashMap<String, Remote>,
    pub tags: Vec<String>,
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
