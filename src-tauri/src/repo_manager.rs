use crate::{
    git2json::{self, CommitLog},
    repo_info::RepoInfo,
};
use git2::{BranchType, FetchOptions, Repository};
use indexmap::IndexMap;
use std::{
    collections::{HashMap, HashSet},
    path::Path,
    sync::{LazyLock, Mutex},
};
use tauri::command;

static ACTIVE_REPOS: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

const BUSY_MSG: &str =
    "Repository is currently in use. Please try again when other operations complete.";

fn is_repo_busy(repo_path: &String) -> bool {
    match ACTIVE_REPOS.lock() {
        Ok(mut active_repos) => {
            let is_busy = active_repos.contains(repo_path);

            if !is_busy {
                active_repos.insert(repo_path.to_string());
            }

            return is_busy;
        }
        Err(err) => {
            eprintln!("Error checking if repo is busy: mutex poisoned - {}", err);
            true
        }
    }
}

pub fn release_repo(repo_path: &String) {
    match ACTIVE_REPOS.lock() {
        Ok(mut active_repos) => {
            active_repos.remove(repo_path);
        }
        Err(err) => {
            eprintln!("Error releasing repo: mutex poisoned - {}", err);
        }
    }
}

pub fn is_repo(repo_path: &String, has_lock: bool) -> Result<bool, String> {
    if !has_lock && is_repo_busy(repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let result = match Repository::open(repo_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    };

    release_repo(repo_path);

    result
}

#[command]
pub async fn create_repo(repo_path: String) -> Result<String, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let create_result = if is_repo(&repo_path, true)? {
        Err("This directory already contains a repository".to_string())
    } else {
        Repository::init(&repo_path)
            .map(|_| format!("Successfully created repository at {}", repo_path))
            .map_err(|e| format!("Error creating repository at '{}' - {}", repo_path, e))
    };

    release_repo(&repo_path);

    create_result
}

//TODO: AUTH
#[command]
pub async fn clone_repo(path: String, repo_url: String) -> Result<String, String> {
    if is_repo_busy(&path) {
        return Err(BUSY_MSG.to_string());
    }

    let clone_path = Path::new(&path);
    let result = match Repository::clone(&repo_url, &clone_path) {
        Ok(_) => Ok("Repository cloned successfully".to_string()),
        Err(e) => {
            eprintln!("Technical error details: {:?}", e);

            Err(match e.code() {
                git2::ErrorCode::Auth => {
                    format!("Authentication failed for repository:\n{}", repo_url)
                }
                git2::ErrorCode::NotFound => {
                    format!("Repository not found for the provided URL:\n{}", repo_url)
                }
                git2::ErrorCode::Exists => format!(
                    "The target directory is not empty:\n{}",
                    clone_path.display()
                ),
                git2::ErrorCode::Certificate => "SSL certificate verification failed".to_string(),
                _ => {
                    let err_msg = format!(
                        "Failed to clone the repository from:\n{}\n\n\
                            Error details: {}",
                        repo_url,
                        e.message()
                    );

                    eprintln!("{}", err_msg);

                    err_msg
                }
            })
        }
    };

    release_repo(&path);

    result
}

#[command]
pub async fn get_repo_info(repo_path: String) -> Result<RepoInfo, String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    if !is_repo(&repo_path, true)? {
        return Err(format!("{} is not a repository", &repo_path));
    }

    let result = (|| {
        let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
        let name = repo_path.to_string();

        // Get the branch that is considered the principal in this repo
        let main_branch: String;
        if repo.head_detached().map_err(|e| e.to_string())? {
            println!("HEAD is detached.");
            main_branch = "master".to_string();
        } else {
            let head = repo.head().map_err(|e| e.to_string())?;
            if let Some(branch_name) = head.shorthand() {
                main_branch = branch_name.to_string();
            } else {
                panic!("\nCould not determine the current branch.");
            }
        }

        // Get current branch
        let current_branch = match repo.head() {
            Ok(head) => head.shorthand().unwrap_or("Unknown").to_string(),
            Err(_) => "Unknown".to_string(),
        };

        // Get local branches
        let local_branches = repo
            .branches(Some(git2::BranchType::Local))
            .map_err(|e| e.to_string())?
            .filter_map(|b| b.ok())
            .filter_map(|(b, _)| b.name().ok().flatten().map(|s| s.to_owned()))
            .collect::<Vec<String>>();

        let tags = repo
            .tag_names(None)
            .map_err(|e| e.to_string())?
            .iter()
            .filter_map(|t| t.map(|s| s.to_string()))
            .collect::<Vec<String>>();

        let commit_history: IndexMap<String, CommitLog> = git2json::get_repo_json(&repo_path)
            .map_err(|e| format!("Error while processing commit history - {}", e.to_string()))?
            .into_iter()
            .enumerate()
            .map(|(_, v)| (v.hash.clone(), v))
            .collect();

        let remotes: HashMap<String, Vec<String>> = get_remote_branches(&repo)?;

        //TODO: TAGS ARE NOT DISPLAYED ON GRAPHS
        let repo = RepoInfo {
            name,
            main_branch,
            current_branch,
            local_branches,
            remotes,
            tags,
            commit_history,
        };

        //println!("\n--{}--\n", serde_json::to_string_pretty(&repo).unwrap());

        Ok(repo)
    })();

    release_repo(&repo_path);

    result
}

fn get_remote_branches(repo: &Repository) -> Result<HashMap<String, Vec<String>>, String> {
    let remote_branches = repo
        .branches(Some(BranchType::Remote))
        .map_err(|e| e.to_string())?;

    let mut remote_branches_map: HashMap<String, Vec<String>> = HashMap::new();
    for branch_entry in remote_branches {
        let (branch, _branch_type) = branch_entry.map_err(|e| e.to_string())?;
        let branch_full_name = branch
            .name()
            .map_err(|e| e.to_string())?
            .unwrap_or_else(|| {
                eprintln!(
                    "Warning: Invalid branch name in entry {:?}",
                    branch.name_bytes()
                );
                "(invalid)"
            });

        let info: Vec<&str> = branch_full_name.split('/').collect();

        if info.len() == 2 {
            let remote = info.first().copied().unwrap_or("Unknown remote");
            let name = info.last().copied().unwrap_or("Unknown branch");
            remote_branches_map
                .entry(remote.to_string())
                .or_default()
                .push(name.to_string());
        } else {
            eprintln!(
                "WARNING!!!! BRANCH NAME SPLIT RESULTED ON MORE THAN2: {}",
                branch_full_name
            )
        }
    }

    Ok(remote_branches_map)
}

//TODO: AUTH
#[command]
pub async fn fetch_remote(
    repo_path: String,
    remote: String,
    fetch_all: bool,
) -> Result<(), String> {
    if is_repo_busy(&repo_path) {
        return Err(BUSY_MSG.to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;
    let mut remote = repo.find_remote(&remote).map_err(|e| e.to_string())?;

    let mut fetch_options = FetchOptions::new();

    remote
        .fetch(&[] as &[&str], Some(&mut fetch_options), None)
        .map_err(|e| e.to_string())?;

    release_repo(&repo_path);

    Ok(())
}
