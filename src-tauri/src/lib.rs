mod config_manager;
mod git2json;
mod repo_manager;
mod repo_watcher;
mod types;
mod workspace_manager;
use std::error::Error;
use std::fs::create_dir_all;
use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri::{command, App};

#[command]
fn open_terminal(mut path: String) -> Result<(), String> {
    if path.is_empty() {
        path = dirs::home_dir()
            .ok_or_else(|| "Could not determine home directory".to_string())?
            .to_string_lossy()
            .to_string();
    }

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

// Init project local data and config paths
fn init_app_paths(app: &mut App) -> Result<(), Box<dyn Error>> {
    let app_handle = app.app_handle();

    for dir in [
        app_handle.path().app_config_dir()?,
        app_handle.path().app_local_data_dir()?,
    ] {
        if !dir.exists() {
            create_dir_all(&dir)?;
        }
    }

    workspace_manager::WORKSPACE_PATH
        .set(
            app_handle
                .path()
                .resolve("workspace.json", BaseDirectory::AppLocalData)
                .map_err(|e| format!("Error resolving Workspace path - {}", e.to_string()))?,
        )
        .map_err(|e| format!("Workspace path already initilized at {}", e.display()))?;

    config_manager::CONFIG_PATH
        .set(
            app_handle
                .path()
                .resolve("config.json", BaseDirectory::AppConfig)
                .map_err(|e| format!("Error resolving Config path - {}", e.to_string()))?,
        )
        .map_err(|e| format!("Config path already initilized at {}", e.display()))?;

    Ok(())
}

// Set workspace global variable
fn set_app_globals(app: &mut App) -> Result<(), Box<dyn Error>> {
    let window = app.get_webview_window("main").unwrap();

    let workspace_json: String = workspace_manager::restore_workspace();
    let config_json: String = config_manager::load_config();

    let eval_command = &format!(
        "window.__WORKSPACE_DTO__ = {}; window.__APP_CONFIG__ = {};",
        workspace_json, config_json
    );
    window.eval(eval_command)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            // General app commands
            open_terminal,
            // Workspace commands
            workspace_manager::open_repo,
            workspace_manager::get_workspace,
            workspace_manager::save_workspace,
            // Configuration commands
            config_manager::get_config,
            config_manager::save_config,
            // Repository commands
            repo_manager::create_repo,
            repo_manager::clone_repo,
            repo_manager::get_repo_info,
            repo_manager::get_repo_status,
            repo_manager::add_to_staging_area,
            repo_manager::remove_from_staging_area,
            repo_manager::fetch_remote,
            repo_manager::pull_remote,
            repo_manager::push_remote,
            repo_manager::create_branch,
            repo_manager::commit,
            // Repository Watcher commands
            repo_watcher::setup_watchers,
            repo_watcher::stop_git_watcher,
            //TODO: DELETE ON RELEASE
            repo_manager::reset,
        ])
        .setup(|app| {
            init_app_paths(app)?;
            set_app_globals(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
