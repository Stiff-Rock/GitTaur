mod repo_info;
mod repo_manager;
use git2::Repository;
use repo_info::RepoInfo;
use repo_manager::RepoManager;
use std::sync::Arc;
use tauri::command;
use tauri::App;
use tauri::Emitter;
use tauri::Manager;
use tauri::State;
use tauri::Window;

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
fn clone_repository(path: String, repo_url: String, state: State<Arc<RepoManager>>) -> String {
    let mut repos_guard = match state.try_lock_repos() {
        Ok(guard) => guard,
        Err(msg) => return msg,
    };

    match Repository::clone(&repo_url, &path) {
        Ok(repo) => {
            repos_guard.insert(path.clone(), repo);
            format!("Repository cloned at: {}", path)
        }
        Err(e) => format!("Error cloning repository: {}", e),
    }
}

fn restore_session(app: &App) {
    let _state = app.state::<Arc<RepoManager>>();
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
            clone_repository
        ])
        .setup(|app| {
            restore_session(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
