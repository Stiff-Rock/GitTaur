mod repo_info;
mod repo_manager;
mod tab;
mod workspace;
use git2::Repository;
use repo_info::RepoInfo;
use repo_manager::RepoManager;
use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::Mutex;
use tab::Tab;
use tauri::command;
use tauri::Window;
use workspace::Workspace;

const WORKSPACE_PATH: &str = "./workspace.json";
lazy_static::lazy_static! {
    static ref REPO_MANAGER: RepoManager = RepoManager::new();

    static ref WORKSPACE: Mutex<Workspace> = Mutex::new(Workspace {
        tabs: HashMap::new(),
        active_tab: String::new(),
    });
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
            format!("Repository created at: {}", path)
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
            format!("Repository opened successfully")
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
fn clone_repository(url: String) -> String {
    let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };
    //OPEN POPUP TO ASK FOR DIR AND URL
    url
}

#[command]
fn get_repo_info(path: String) -> Result<RepoInfo, String> {
    let repos_guard = REPO_MANAGER
        .try_lock_repos()
        .map_err(|e| format!("Failed to lock repos: {}", e))?;

    REPO_MANAGER
        .get_repo_info(&path, &repos_guard)
        .map_err(|e| format!("Failed to get repo info of repo {}: {}", path, e))
}

#[command]
fn get_last_directory(path: &str) -> String {
    let path = std::path::Path::new(path);
    let last_component = match path.file_name() {
        Some(name) => name,
        None => path
            .parent()
            .and_then(|p| p.file_name())
            .expect("Failed to extract last directory from the path"),
    };
    last_component.to_str().expect("Invalid UTF-8").to_string()
}

#[command]
fn save_workspace(workspace: Workspace) -> Result<(), String> {
    // Update the workspace object
    let mut workspace_lock = WORKSPACE.lock().unwrap();
    *workspace_lock = workspace.clone();

    // Update the workspace json
    let json_data = serde_json::to_string_pretty(&workspace).map_err(|e| e.to_string())?;
    fs::write(WORKSPACE_PATH, json_data).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
fn get_workspace() -> Workspace {
    let workspace_lock = WORKSPACE.lock().unwrap();
    workspace_lock.clone()
}

fn restore_session() {
    let path = Path::new(WORKSPACE_PATH);
    if !path.exists() {
        let json_data = serde_json::json!({
            "tabs": {},
            "activeTab": ""
        })
        .to_string();

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

        for key in workspace_lock.tabs.keys() {
            let mut repos_guard = match REPO_MANAGER.try_lock_repos() {
                Ok(guard) => guard,
                Err(_) => return,
            };

            if repos_guard.contains_key(key) {
                return;
            }

            match Repository::open(key) {
                Ok(repo) => repos_guard.insert(key.clone(), repo),
                Err(_) => return,
            };
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_repository,
            open_repository,
            close_repository,
            clone_repository,
            get_workspace,
            get_last_directory,
            get_repo_info,
            save_workspace,
        ])
        .setup(|_| {
            restore_session();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
