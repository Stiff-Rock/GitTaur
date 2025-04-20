mod repo_info;
mod repo_manager;
mod tab;
mod workspace;
use git2::{BranchType, Oid, Repository};
use indexmap::IndexMap;
use regex::Regex;
use repo_info::{FileChange, RepoInfo};
use repo_manager::RepoManager;
use serde::Serialize;
use std::fs;
use std::fs::{metadata, File};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Mutex, MutexGuard, TryLockError};
use tab::Tab;
use tauri::command;
use workspace::Workspace;

const WORKSPACE_PATH: &str = "./workspace.json";
lazy_static::lazy_static! {
    static ref REPO_MANAGER: Mutex<RepoManager>  = Mutex::new(RepoManager::new());

    static ref WORKSPACE: Mutex<Workspace> = Mutex::new(Workspace {
        tabs: IndexMap::new(),
        active_tab: String::new(),
    });

    static ref WELCOME_PAGE_REGEX: Regex = Regex::new(r"^Welcome Page:\d+$").unwrap();
}

fn try_lock_repo() -> Result<MutexGuard<'static, RepoManager>, String> {
    match REPO_MANAGER.try_lock() {
        Ok(guard) => Ok(guard),
        Err(TryLockError::WouldBlock) => {
            Err("Another operation is currently in progress".to_string())
        }
        Err(TryLockError::Poisoned(_)) => Err(
            "The repository manager is in an inconsistent state due to a previous panic."
                .to_string(),
        ),
    }
}

#[command]
fn create_repository(path: String) -> String {
    match try_lock_repo() {
        Ok(_) => Repository::init(&path)
            .map(|_| format!("successfully created repository at {}", path))
            .unwrap_or_else(|e| format!("error creating repository at '{}' - {}", path, e)),
        Err(msg) => return msg,
    }
}

#[command]
fn open_repository(path: String) -> String {
    if get_workspace().tabs.contains_key(&path) {
        return format!("Repository already opened at: {}", path);
    }

    match try_lock_repo() {
        Ok(_) => Repository::init(&path)
            .map(|_| format!("Successfully opened repository at {}", path))
            .unwrap_or_else(|e| format!("Error opening repository at '{}' - {}", path, e)),
        Err(msg) => return msg,
    }
}

#[command]
fn clone_repository(path: String, repo_url: String) -> String {
    match try_lock_repo() {
        Ok(repo_manager) => repo_manager.clone_repo(path, repo_url),
        Err(msg) => return msg,
    }
}

#[command]
fn get_repo_info(path: String) -> Result<RepoInfo, String> {
    let repos_manager = try_lock_repo()?;

    repos_manager
        .get_repo_info(path.clone())
        .map_err(|e| format!("Failed to get repo info with path <{}>: {}", path, e))
}

#[command]
fn get_commit_changes(repo_path: String, sha: String) -> Result<Vec<FileChange>, String> {
    let repos_manager = try_lock_repo()?;
    let repo = repos_manager.open_repo(repo_path)?;
    let oid = Oid::from_str(&sha).map_err(|e| e.to_string())?;
    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
    Ok(RepoManager::get_commit_changes(&repo, &commit).map_err(|e| e.to_string())?)
}

#[command]
fn get_last_directory(path: &str) -> String {
    if WELCOME_PAGE_REGEX.is_match(path) {
        return "Welcome Page".to_string();
    }

    let path = Path::new(path);

    let last_component = path
        .file_name()
        .or_else(|| path.parent().and_then(|p| p.file_name()))
        .and_then(|name| name.to_str())
        .unwrap_or("Unknown");

    last_component.to_string()
}

#[command]
fn save_workspace(workspace: Workspace) -> Result<(), String> {
    let mut workspace_lock = WORKSPACE.lock().map_err(|e| e.to_string())?;
    *workspace_lock = workspace.clone();

    let json_data = serde_json::to_string_pretty(&workspace).map_err(|e| e.to_string())?;
    fs::write(WORKSPACE_PATH, json_data).map_err(|e| format!("Failed to save: {}", e))?;

    Ok(())
}

#[command]
fn get_workspace() -> Workspace {
    let workspace_lock = WORKSPACE.lock().unwrap();
    workspace_lock.clone()
}

#[command]
fn open_terminal(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = std::process::Command::new("cmd.exe")
            .args(&["/C", "start", "cmd.exe", "/K", "cd", "/d", &path])
            .spawn()
        {
            println!("Error opening terminal on Windows: {}", e);
            return Err(e.to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"cd {}\"", path);
        if let Err(e) = std::process::Command::new("osascript")
            .args(&["-e", &script])
            .spawn()
        {
            println!("Error opening terminal on macOS: {}", e);
            return Err(e.to_string());
        }
    }
    //TODO: USER CONFIG, LET USER SELECT WHAT TERMINAL TO USE
    #[cfg(target_os = "linux")]
    {
        let terminal =
            std::env::var("TERMINAL").unwrap_or_else(|_| "x-terminal-emulator".to_string());
        if let Err(e) = std::process::Command::new(terminal)
            .current_dir(&path)
            .spawn()
        {
            println!("Error opening terminal on Linux: {}", e);
            return Err(e.to_string());
        }
    }
    Ok(())
}

fn restore_session() {
    let path = Path::new(WORKSPACE_PATH);

    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let workspace_instance = WORKSPACE.lock().unwrap();

        let json_data = serde_json::to_string_pretty(&*workspace_instance)
            .map_err(|e| e.to_string())
            .expect("Failed to serialize workspace");

        let mut file = File::create(WORKSPACE_PATH).expect("Failed to create workspace.json");
        file.write_all(json_data.as_bytes())
            .expect("Failed to write default JSON content");
    } else {
        let mut file = File::open(path).expect("Error while reading workspace file");

        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .expect("Error reading workspace file contents");

        let repo_manager = match try_lock_repo() {
            Ok(repo_manager) => repo_manager,
            Err(e) => {
                println!("Could not restore previous workspace session - {}", e);
                return;
            }
        };

        let mut workspace = match WORKSPACE.lock() {
            Ok(guard) => guard,
            Err(e) => {
                println!("Could not restore previous workspace session - {}", e);
                return;
            }
        };
        *workspace = serde_json::from_str(&contents).expect("Failed to load workspace info");

        for key in workspace.tabs.keys() {
            if WELCOME_PAGE_REGEX.is_match(key) {
                continue;
            }

            /*match Repository::open(key) {
                Ok(repo) => repo_manager.insert(key.clone(), repo),
                Err(e) => {
                    println!("Failed to open repository while restoring session: {}", e);
                    return;
                }
            };*/
        }
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct CommitInfo {
    id: String,
    message: String,
    author: String,
    timestamp: i64,
    parent_ids: Vec<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct BranchInfo {
    name: String,
    commit_id: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct TagInfo {
    name: String,
    commit_id: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct GitData {
    commits: Vec<CommitInfo>,
    branches: Vec<BranchInfo>,
    tags: Vec<TagInfo>,
}

// Extract git data - receives repository path directly as a parameter
#[command]
fn extract_git_data(repo_path: String) -> Result<GitData, String> {
    // Open repository
    let repo =
        Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;

    let mut git_data = GitData {
        commits: Vec::new(),
        branches: Vec::new(),
        tags: Vec::new(),
    };

    // Get commits
    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;

    // Configure revwalk to follow all branches
    revwalk
        .push_glob("refs/heads/*")
        .map_err(|e| format!("Failed to push refs to revwalk: {}", e))?;

    // Sort by time (topological and time sort ensures parents come before children)
    revwalk
        .set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
        .map_err(|e| format!("Failed to set revwalk sorting: {}", e))?;

    // Process each commit
    for oid_result in revwalk {
        let oid = oid_result.map_err(|e| format!("Failed to get commit oid: {}", e))?;
        let commit = repo
            .find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        // Get parent IDs
        let parent_ids = commit.parent_ids().map(|id| id.to_string()).collect();

        // Get commit message
        let message = commit.message().unwrap_or("").to_string();

        // Get author
        let author = commit.author().name().unwrap_or("").to_string();

        git_data.commits.push(CommitInfo {
            id: oid.to_string(),
            message,
            author,
            timestamp: commit.time().seconds(),
            parent_ids,
        });
    }

    // Get branches
    if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
        for branch_result in branches {
            if let Ok((branch, _)) = branch_result {
                if let Ok(Some(name)) = branch.name() {
                    if let Ok(commit) = branch.get().peel_to_commit() {
                        git_data.branches.push(BranchInfo {
                            name: name.to_string(),
                            commit_id: commit.id().to_string(),
                        });
                    }
                }
            }
        }
    }

    // Get tags
    if let Ok(tag_names) = repo.tag_names(None) {
        for tag_name in tag_names.iter().flatten() {
            if let Ok(tag_ref) = repo.find_reference(&format!("refs/tags/{}", tag_name)) {
                if let Ok(commit) = tag_ref.peel_to_commit() {
                    git_data.tags.push(TagInfo {
                        name: tag_name.to_string(),
                        commit_id: commit.id().to_string(),
                    });
                }
            }
        }
    }

    Ok(git_data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_repository,
            open_repository,
            clone_repository,
            get_workspace,
            get_last_directory,
            get_repo_info,
            save_workspace,
            open_terminal,
            get_commit_changes,
            extract_git_data
        ])
        .setup(|_| {
            restore_session();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
