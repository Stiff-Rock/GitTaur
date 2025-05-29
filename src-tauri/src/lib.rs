mod config_manager;
mod git2json;
mod repo_manager;
mod repo_watcher;
mod types;
mod workspace_manager;
use chrono::Local;
use fern::colors::{Color, ColoredLevelConfig};
use fern::Dispatch;
use log::{info, LevelFilter};
use std::error::Error;
use std::fs::create_dir_all;
use tauri::AppHandle;
use tauri::{command, path::BaseDirectory, App, Manager, Theme as TauriTheme};
use tauri_plugin_shell::process::Command;
use tauri_plugin_shell::ShellExt;
use types::config::Theme;

#[cfg(debug_assertions)]
use crate::types::repo_guard;

//TODO: FUTURE:: Try to debug libssh2-rs to see why so many keys don't work or implement ssh-agent

//TODO: Terminal personalization

//TODO: PROPER ERRORS, INSTEAD OF SO MUCH .map_err

#[command]
fn open_terminal(mut path: String, app_handle: AppHandle) -> Result<(), String> {
    if path.is_empty() {
        path = dirs::home_dir()
            .ok_or_else(|| "Could not determine home directory".to_string())?
            .to_string_lossy()
            .to_string();
    }

    let shell = app_handle.shell();
    let command: Command;

    #[cfg(target_os = "windows")]
    {
        command = shell
            .command("cmd.exe")
            .args(&["/C", "start", "cmd.exe", "/K", "cd", "/d", &path])
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!("tell application \"Terminal\" to do script \"cd {}\"", path);
        command = shell.command("osascript").args(&["-e", &script])
    }

    #[cfg(target_os = "linux")]
    {
        let terminal =
            std::env::var("TERMINAL").unwrap_or_else(|_| "x-terminal-emulator".to_string());
        command = shell.command(terminal).current_dir(&path)
    }

    command
        .spawn()
        .map_err(|e| format!("Error executing terminal: {e}"))?;

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
    let workspace_json: String = workspace_manager::restore_workspace();
    let config_json: String = config_manager::load_config();

    let eval_command = &format!(
        "window.__WORKSPACE_DTO__ = {}; window.__APP_CONFIG__ = {};",
        workspace_json, config_json
    );
    app.get_webview_window("main").unwrap().eval(eval_command)?;

    Ok(())
}

fn setup_app_theme(app: &mut App) -> Result<(), Box<dyn Error>> {
    let mut config = config_manager::get_config();

    let theme_config: Theme = config.theme_config;
    match theme_config {
        Theme::System => {
            let window = app.get_webview_window("main").unwrap();
            let system_theme = match window.theme() {
                Ok(TauriTheme::Dark) => Theme::Dark,
                Ok(TauriTheme::Light) => Theme::Light,
                _ => Theme::Dark,
            };
            config.theme_value = system_theme;
        }
        Theme::Dark => app.set_theme(Some(TauriTheme::Dark)),
        Theme::Light => app.set_theme(Some(TauriTheme::Light)),
    }

    let theme_str = match config.theme_value {
        Theme::Light => "light",
        Theme::Dark => "dark",
        _ => "dark",
    };

    let eval_command = &format!(
        "
    function applyTheme() {{
        document.documentElement.setAttribute('data-theme', '{}');
        document.documentElement.style.setProperty('--active-color', '{}');
    }}

    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', applyTheme);
    }} else {{
        applyTheme();
    }}
    ",
        theme_str, config.accent_color
    );
    app.get_webview_window("main").unwrap().eval(eval_command)?;

    Ok(())
}

fn setup_logging(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let colors = ColoredLevelConfig::new()
        .error(Color::Red)
        .warn(Color::Yellow)
        .info(Color::Green)
        .debug(Color::Blue)
        .trace(Color::Magenta);

    let is_dev = cfg!(debug_assertions);

    if is_dev {
        Dispatch::new()
            .level(LevelFilter::Trace)
            .level_for("notify", LevelFilter::Info)
            .format(move |out, message, record| {
                out.finish(format_args!(
                    "[{}] {}",
                    colors.color(record.level()),
                    message
                ))
            })
            .chain(std::io::stdout())
            .apply()?;
    } else {
        let app_handle = app.app_handle();
        let app_log_dir = app_handle.path().app_log_dir()?;

        if !app_log_dir.exists() {
            create_dir_all(&app_log_dir)?;
        }

        let log_file = app_log_dir.join("app.log");

        Dispatch::new()
            .level(LevelFilter::Info)
            .chain(Dispatch::new().level(LevelFilter::Info))
            .format(move |out, message, record| {
                out.finish(format_args!(
                    "[{}][{}] {}",
                    record.level(),
                    Local::now().format("%Y-%m-%d %H:%M:%S"),
                    message
                ))
            })
            .chain(fern::log_file(log_file)?)
            .apply()?;
    }

    info!("Logger initialized");
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
            config_manager::set_global_git_user_id,
            // Repository commands
            repo_manager::create_repo,
            repo_manager::clone_repo,
            repo_manager::get_repo_info,
            repo_manager::get_repo_status,
            repo_manager::get_stashed_changes,
            repo_manager::get_file_diff,
            repo_manager::get_file_diff_from_stash,
            repo_manager::add_to_staging_area,
            repo_manager::remove_from_staging_area,
            repo_manager::discard_changes,
            repo_manager::stash_changes,
            repo_manager::apply_stash,
            repo_manager::drop_stash,
            repo_manager::pop_stash,
            repo_manager::fetch_remote,
            repo_manager::pull_remote,
            repo_manager::push_remote,
            repo_manager::create_branch,
            repo_manager::commit,
            // Repository Watcher commands
            repo_watcher::setup_watchers,
            repo_watcher::stop_git_watcher,
            // Debug functions
            #[cfg(debug_assertions)]
            repo_guard::reset,
        ])
        .setup(|app| {
            setup_logging(app)?;
            init_app_paths(app)?;
            set_app_globals(app)?;
            setup_app_theme(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
