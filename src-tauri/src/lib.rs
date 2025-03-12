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
use std::sync::Arc;
use std::sync::Mutex;
use tab::Tab;
use tauri::command;
use tauri::Emitter;
use tauri::State;
use tauri::Window;
use workspace::Workspace;

const WORKSPACE_PATH: &str = "./workspace.json";
lazy_static::lazy_static! {
static ref WORKSPACE: Mutex<Workspace> = Mutex::new(Workspace {
        tabs: HashMap::new(),
        active_tab: String::new(),
    });
}

#[command]
fn create_repository(path: String, state: State<Arc<RepoManager>>) -> String {
    let mut repos_guard = match state.try_lock_repos() {
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

#[command]
fn open_repository(path: String, state: State<Arc<RepoManager>>, window: Window) -> String {
    let mut repos_guard = match state.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    if repos_guard.contains_key(&path) {
        return format!("Repository already opened at: {}", path);
    }

    match Repository::open(&path) {
        Ok(repo) => {
            repos_guard.insert(path.clone(), repo);
            match state.get_repo_info(&path, &repos_guard) {
                Ok(info) => {
                    emit_info(window, &info);
                    format!("Repository opened at: {}", path)
                }
                Err(e) => format!("Error getting repo info: {}", e),
            }
        }
        Err(e) => format!("Error opening repository: {}", e),
    }
}

fn emit_info(window: Window, repo_info: &RepoInfo) {
    window.emit("repo-info", repo_info).unwrap();
}

#[command]
fn clone_repository(
    path: String,
    repo_url: String,
    state: State<Arc<RepoManager>>,
    window: Window,
) -> String {
    let mut repos_guard = match state.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    match Repository::clone(&repo_url, &path) {
        Ok(repo) => {
            repos_guard.insert(path.clone(), repo);
            match add_tab(path.clone()) {
                Ok(_) => match state.get_repo_info(&path, &repos_guard) {
                    Ok(info) => {
                        emit_info(window, &info);
                        format!("Repository cloned at: {}", path)
                    }
                    Err(e) => format!("Error getting repo info: {}", e),
                },
                Err(e) => format!("Error adding tab for repository: {}", e),
            }
        }
        Err(e) => format!("Error cloning repository: {}", e),
    }
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

fn add_tab(repo_path: String) -> std::io::Result<()> {
    let mut workspace_lock = WORKSPACE.lock().unwrap();
    let label = get_last_directory(&repo_path);
    workspace_lock.add_tab(label, repo_path);
    save_workspace(&workspace_lock)
}

#[command]
fn remove_tab() -> std::io::Result<()> {
    Ok(())
}

#[command]
fn switch_tab(_prev_tab_id: i32) -> std::io::Result<()> {
    Ok(())
}

fn save_workspace(workspace: &Workspace) -> std::io::Result<()> {
    let json_data = serde_json::to_string_pretty(workspace)?;
    fs::write(WORKSPACE_PATH, json_data)?;
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
            .expect("Error reading workspace file contets");

        let mut workspace_lock = WORKSPACE.lock().unwrap();
        *workspace_lock = serde_json::from_str(&contents).expect("Failed to load workspace info");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(RepoManager::new()))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_repository,
            open_repository,
            clone_repository,
            get_workspace,
            get_last_directory,
        ])
        .setup(|_| {
            restore_session();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
