mod git2json;
mod repo_info;
mod repo_manager;
mod repo_watcher;
mod tab;
mod workspace;
use tab::Tab;
use tauri::command;
use tauri::Manager;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            workspace::open_repo,
            workspace::get_workspace,
            workspace::save_workspace,
            repo_manager::create_repo,
            repo_manager::clone_repo,
            repo_manager::get_repo_info,
            repo_manager::get_repo_status,
            repo_manager::add_to_staging_area,
            repo_manager::fetch_remote,
            repo_manager::pull_remote,
            repo_manager::push_remote,
            repo_manager::create_branch,
            repo_watcher::watch_git_status,
            repo_watcher::stop_git_watcher,
            open_terminal,
            //TODO: DELETE ON RELEASE
            repo_manager::reset,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let workspace_json: String = workspace::restore_workspace();

            let eval_command = &format!("window.__WORKSPACE_DTO__ = {}", workspace_json);
            window.eval(eval_command)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
