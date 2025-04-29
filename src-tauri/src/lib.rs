mod repo_info;
mod repo_manager;
mod tab;
use git2::Repository;
mod git2json;
use indexmap::IndexMap;
use regex::Regex;
use repo_info::RepoInfo;
use repo_manager::RepoManager;
use serde::Serialize;
use std::fs;
use std::fs::{metadata, File};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Mutex, MutexGuard, TryLockError};
mod workspace;
use tab::Tab;
use tauri::command;
use workspace::Workspace;

const WORKSPACE_PATH: &str = "./workspace.json";
lazy_static::lazy_static! {
    static ref REPO_MANAGER: RepoManager =RepoManager::new();
    static ref REPO_MANAGER_MUTEX: Mutex<RepoManager>  = Mutex::new(REPO_MANAGER);

    static ref WORKSPACE: Mutex<Workspace> = Mutex::new(Workspace {
        tabs: IndexMap::new(),
        active_tab: String::new(),
    });

    static ref WELCOME_PAGE_REGEX: Regex = Regex::new(r"^Welcome Page:\d+$").unwrap();
}

fn try_lock_repo() -> Result<MutexGuard<'static, RepoManager>, String> {
    match REPO_MANAGER_MUTEX.try_lock() {
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
            .map(|_| "".to_string())
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
async fn get_repo_info(repo_path: String) -> Result<RepoInfo, String> {
    //TODO: MAYBE THIS OPERATION CAN BE QUEUED (normal .lock()) instead of inmedieatily negating
    //let repos_manager = try_lock_repo()?;

    repos_manager
        .get_repo_info(repo_path.clone())
        .map_err(|e| format!("Failed to get repo info with path <{}>: {}", repo_path, e))
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

        /*let repo_manager = match try_lock_repo() {
            Ok(repo_manager) => repo_manager,
            Err(e) => {
                println!("Could not restore previous workspace session - {}", e);
                return;
            }
        };*/

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

            /*for key in workspace.tabs.keys() {
                if WELCOME_PAGE_REGEX.is_match(key) {
                    continue;
                }

                match Repository::open(key) {
                    Ok(repo) => repo_manager.insert(key.clone(), repo),
                    Err(e) => {
                        println!("Failed to open repository while restoring session: {}", e);
                        return;
                    }
                };
            }*/

            //TODO: SINCE REPO MANAGER DOES NOT STORE OPENED REPOS ANYMROE THIS DOES NOT MAKE SENSE
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
        ])
        .setup(|_| {
            restore_session();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
