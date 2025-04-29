use crate::{
    git2json::{self, CommitLog},
    repo_info::RepoInfo,
};
use git2::{BranchType, Repository};
use indexmap::IndexMap;
use std::{collections::HashMap, path::Path, sync::Mutex};

pub struct RepoManager {
    state: Mutex<()>,
    repos
}

impl RepoManager {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(()),
        }
    }

    //NOTE: UNUSED FN
    pub fn _open_repo(&self, path: String) -> Result<Repository, String> {
        Repository::open(path).map_err(|e| format!("Error while opening repository: {}", e))
    }

    pub fn clone_repo(&self, path: String, repo_url: String) -> String {
        let clone_path = Path::new(&path);
        match Repository::clone(&repo_url, &clone_path) {
            Ok(_) => "".to_string(),
            Err(e) => {
                println!("Technical error details: {:?}", e);

                return match e.code() {
                git2::ErrorCode::Auth => format!(
                    "Authentication failed for repository:\n{}\n\n\
                    Please check your credentials or SSH keys.",
                    repo_url
                ),
                git2::ErrorCode::NotFound => format!(
                    "The repository was not found at the provided URL:\n{}\n\n\
                    Please ensure the URL is correct and the repository is accessible.",
                    repo_url
                ),
                git2::ErrorCode::Exists => format!(
                    "The target directory already exists at:\n{}\n\n\
                    Please choose a different directory or remove the existing one before cloning.",
                    clone_path.display()
                ),
                git2::ErrorCode::Certificate => {
                    "SSL certificate verification failed. This can be caused by:\n\
                    - Invalid server certificate\n\
                    - System clock mismatch\n\
                    - Corporate network restrictions\n\n\
                    Please check your system's certificate settings or consult your network administrator."
                        .to_string()
                }
                _ => format!(
                    "Failed to clone the repository from:\n{}\n\n\
                    Error details: {}",
                    repo_url,
                    e.message()
                ),
            };
            }
        }
    }

    pub fn get_repo_info(&self, repo_path: String) -> Result<RepoInfo, String> {
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
            Ok(head) => head.name().unwrap_or("Unknown").to_string(),
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

        let commit_history: IndexMap<String, CommitLog> = git2json::get_repo_json(repo_path)
            .map_err(|e| format!("Error while processing commit history - {}", e.to_string()))?
            .into_iter()
            .enumerate()
            .map(|(_, v)| (v.hash.clone(), v))
            .collect();

        let remotes: HashMap<String, Vec<String>> = Self::get_remote_branches(&repo)?;
        println!("\n--REMOTES{:#?}--\n", remotes);

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

            println!("{}", branch_full_name);

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
}
