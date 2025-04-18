mod repo_info;
mod repo_manager;
mod tab;
mod workspace;
use git2::{BranchType, Oid, Repository};
use regex::Regex;
use repo_info::{FileChange, RepoInfo};
use repo_manager::RepoManager;
use serde::Serialize;
use std::fs;
use std::fs::{metadata, File};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::Mutex;
use tab::Tab;
use tauri::command;
use workspace::Workspace;

const WORKSPACE_PATH: &str = "./workspace.json";
lazy_static::lazy_static! {
    static ref REPO_MANAGER: RepoManager = RepoManager::new();

    static ref WORKSPACE: Mutex<Workspace> = Mutex::new(Workspace {
        tabs: Vec::new(),
        active_tab: String::new(),
    });

    static ref WELCOME_PAGE_REGEX: Regex = Regex::new(r"^Welcome Page:\d+$").unwrap();
}

#[command]
fn create_repository(path: String) -> String {
    let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    match Repository::init(&path) {
        Ok(repo) => {
            repos_guard.insert(path.clone(), repo);
            format!("")
        }
        Err(e) => format!("Error creating repository: {}", e),
    }
}

// REFACTOR THIS FUNCTION AS THE get_repo_info
#[command]
fn open_repository(path: String) -> String {
    let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    if repos_guard.contains_key(&path) {
        return format!("Repository already opened at: {}", path);
    }

    match Repository::open(&path) {
        Ok(repo) => {
            repos_guard.insert(path.clone(), repo);
            format!("")
        }
        Err(e) => format!("Error opening repository: {}", e),
    }
}

#[command]
fn close_repository(path: String) -> String {
    let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    if !repos_guard.contains_key(&path) {
        return format!("Repository not found: {}", path);
    }

    match repos_guard.remove(&path) {
        Some(_) => format!("Repository closed: {}", path),
        None => format!("Repository not found: {}", path),
    }
}

#[command]
fn clone_repository(path: String, repo_url: String) -> Result<String, String> {
    let clone_path = Path::new(&path);
    let repo = match Repository::clone(&repo_url, &clone_path) {
        Ok(repo) => repo,
        Err(e) => {
            // Log the technical details for debugging
            println!("Technical error details: {:?}", e);

            return Err(match e.code() {
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
            });
        }
    };

    let mut repos_guard = REPO_MANAGER
        .try_lock_repos()
        .map_err(|e| format!("Failed to lock repository manager: {}", e))?;

    match repos_guard.insert(path.clone(), repo) {
        Some(existing) => Ok(format!(
            "This repository is already managed at:\n{}",
            existing.path().display()
        )),
        None => Ok("Repository cloned successfully and is now managed.".to_string()),
    }
}

#[command]
fn get_repo_info(path: String) -> Result<RepoInfo, String> {
    let repos_guard = REPO_MANAGER.try_lock_repos().map_err(|e| {
        println!("Failed to lock REPO_MANAGER: {}", e);
        format!("Failed to get repo info: {}", e)
    })?;

    REPO_MANAGER
        .get_repo_info(&path, &repos_guard)
        .map_err(|e| format!("Failed to get repo info with path <{}>: {}", path, e))
}

#[command]
fn get_commit_changes(repo_path: String, sha: String) -> Result<Vec<FileChange>, String> {
    let repos_guard = REPO_MANAGER.try_lock_repos().map_err(|e| {
        println!("Failed to lock REPO_MANAGER: {}", e);
        format!("Failed to get repo info: {}", e)
    })?;

    let repo = repos_guard
        .get(&repo_path)
        .ok_or_else(|| "Repository not found".to_string())?;

    let oid = Oid::from_str(&sha).map_err(|e| e.to_string())?;

    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

    let changes = RepoManager::get_commit_changes(repo, &commit).map_err(|e| e.to_string())?;

    Ok(changes)
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
//TODO: REPO_MANAGER Repository objects block any otehr porgram interacting with the repo files
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

        let mut workspace_lock = WORKSPACE.lock().unwrap();
        *workspace_lock = serde_json::from_str(&contents).expect("Failed to load workspace info");

        let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
            Ok(guard) => guard,
            Err(e) => {
                println!("{}", e);
                return;
            }
        };

        for (key, _) in &workspace_lock.tabs {
            if WELCOME_PAGE_REGEX.is_match(key) || repos_guard.contains_key(key) {
                continue;
            }

            match Repository::open(key) {
                Ok(repo) => repos_guard.insert(key.clone(), repo),
                Err(e) => {
                    println!("Failed to open repository while restoring session: {}", e);
                    return;
                }
            };
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
            close_repository,
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
