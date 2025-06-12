mod config_manager;
mod repo_manager;
mod repo_reader;
mod repo_watcher;
mod types;
mod workspace_manager;
use chrono::Local;
use fern::colors::{Color, ColoredLevelConfig};
use fern::Dispatch;
use log::{error, info, trace, LevelFilter};
use repo_manager::is_repo;
use std::fs::{read_to_string, OpenOptions};
use std::{
    error::Error,
    fs::{create_dir_all, File},
    io::{BufRead, BufReader, Write},
    path::Path,
};
use tauri::WebviewWindow;
use tauri::{command, path::BaseDirectory, App, AppHandle, Manager, Theme as TauriTheme};
use tauri_plugin_shell::{process::Command, ShellExt};
use types::config::Theme;

#[cfg(debug_assertions)]
use crate::types::repo_guard;

const TODO_FILE_NAME: &str = "gittaur-todo-list.md";

//BUG: WHEN CREATING REPO -> Error: reference 'refs/heads/master' not found; class=Reference (4); code=UnbornBranch (-9)
//BUG: IT ALLOWS YOU TO DO EMPTY COMMITS
//BUG: TAGS DONT UPDATE WHEN CREATED

#[command]
async fn create_todo_file(repo_path: String) -> Result<String, String> {
    trace!("Creating todo list file at {repo_path}");

    let path = Path::new(&repo_path);

    if !path.exists() || !path.is_dir() {
        let msg = format!("Error creating todo-list file, the selected path to store is not a valid directory ({repo_path})");
        error!("{}", msg);
        return Err(msg);
    }

    let file_path = path.join(TODO_FILE_NAME);

    if file_path.exists() {
        let content = read_to_string(&file_path).map_err(|e| e.to_string())?;
        return Ok(content);
    }

    // Add Todo MD file to .gitignore if the directory
    if !is_repo(&repo_path, false)? {
        let msg = "The target directory is not a repository".to_string();
        error!("{msg}");
        return Err(msg);
    }

    info!("Creating todo-list file at location {repo_path}");
    File::create(file_path).map_err(|e| e.to_string())?;

    let gitignore_path = Path::new(&repo_path).join(".gitignore");
    if gitignore_path.exists() {
        let file = File::open(&gitignore_path).map_err(|e| e.to_string())?;
        let reader = BufReader::new(file);
        let mut pattern_exists = false;

        for line in reader.lines() {
            let line = line.map_err(|e| e.to_string())?;
            if line.trim() == TODO_FILE_NAME {
                pattern_exists = true;
                break;
            }
        }

        if !pattern_exists {
            info!("Adding .gitignore entry for todo-list file");

            let mut file = OpenOptions::new()
                .append(true)
                .open(&gitignore_path)
                .map_err(|e| e.to_string())?;

            let content = read_to_string(&gitignore_path).map_err(|e| e.to_string())?;

            if !content.is_empty() && !content.ends_with('\n') {
                writeln!(file).map_err(|e| e.to_string())?;
            }

            writeln!(file, "{}", TODO_FILE_NAME).map_err(|e| e.to_string())?;
        }
    } else {
        info!("Creating .gitignore file to add a todo-list file entry");

        let mut file = File::create(gitignore_path).map_err(|e| e.to_string())?;
        writeln!(file, "{}", TODO_FILE_NAME).map_err(|e| e.to_string())?;
    }

    Ok("".to_string())
}

#[command]
async fn save_todo_file(repo_path: String, todo_text: String) -> Result<(), String> {
    trace!("Saving todo list file at {repo_path}");

    let path = Path::new(&repo_path);

    if !path.exists() || !path.is_dir() {
        let msg = format!(
            "Error saving todo-list file, the path to store is not a valid directory ({repo_path})"
        );
        error!("{}", msg);
        return Err(msg);
    }

    let file_path = path.join(TODO_FILE_NAME);

    if !file_path.exists() {
        create_todo_file(repo_path.clone()).await?;
    }

    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(&file_path)
        .map_err(|e| e.to_string())?;

    info!("Saving todo-list file located at {repo_path}");

    file.write_all(todo_text.as_bytes())
        .map_err(|e| e.to_string())?;

    file.flush().map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
async fn open_terminal(mut path: String, app_handle: AppHandle) -> Result<(), String> {
    info!("Opening terminal in {path}");

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
    trace!("Initializing app paths");

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
fn set_app_globals(webview: &WebviewWindow) -> Result<(), Box<dyn Error>> {
    trace!("Setting up app global variables");

    let workspace_json: String = workspace_manager::restore_workspace()?;
    let config_json: String = config_manager::load_config()?;

    let eval_command = &format!(
        "window.__WORKSPACE_DTO__ = {}; window.__APP_CONFIG__ = {};",
        workspace_json, config_json
    );

    webview.eval(eval_command)?;

    Ok(())
}

fn setup_app_theme(webview: &WebviewWindow) -> Result<(), Box<dyn Error>> {
    trace!("Setting up app theme");

    let config = config_manager::get_config()?;

    let theme_str = if matches!(config.theme_config, Theme::System) {
        match webview.theme() {
            Ok(TauriTheme::Dark) => "dark",
            Ok(TauriTheme::Light) => "light",
            _ => "dark",
        }
    } else {
        match config.theme_value {
            Theme::Dark => "dark",
            Theme::Light => "light",
            _ => "dark",
        }
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

    webview.eval(eval_command)?;

    Ok(())
}

fn setup_logging(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    trace!("Setting up logger");

    let colors = ColoredLevelConfig::new()
        .error(Color::Red)
        .warn(Color::Yellow)
        .info(Color::Green)
        .debug(Color::Blue)
        .trace(Color::Magenta);

    let is_dev = cfg!(debug_assertions);

    if is_dev {
        Dispatch::new()
            .level(LevelFilter::Info)
            .level_for("notify", LevelFilter::Info)
            .level_for("gittaur_lib::repo_manager", LevelFilter::Off)
            .level_for("gittaur_lib::repo_reader", LevelFilter::Off)
            .level_for("gittaur_lib::repo_watcher", LevelFilter::Trace)
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

    info!("--<<Logger initialized>>--");
    Ok(())
}

fn handle_setup_error(error: Box<dyn Error>) -> Box<dyn Error> {
    let msg = format!("Error during setup: {error}");
    error!("{msg}");
    tinyfiledialogs::message_box_ok(
        "GitTaur Error",
        &msg,
        tinyfiledialogs::MessageBoxIcon::Error,
    );

    Box::new(std::io::Error::new(std::io::ErrorKind::Other, msg))
}

fn get_main_webview(app: &App) -> Result<WebviewWindow, Box<dyn Error>> {
    match app.get_webview_window("main") {
        Some(webview) => Ok(webview),
        None => {
            let error = std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Unable to obtain webview window setting up app theme",
            );
            Err(handle_setup_error(Box::new(error)))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let run_result = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            // General app commands
            create_todo_file,
            save_todo_file,
            open_terminal,
            // Workspace commands
            workspace_manager::open_repo,
            workspace_manager::get_workspace,
            workspace_manager::save_workspace,
            // Configuration commands
            config_manager::restore_config_defaults,
            config_manager::get_config,
            config_manager::save_config,
            config_manager::set_global_git_user_id,
            // Repository read commands
            repo_reader::get_repo_info,
            repo_reader::get_commit_history,
            repo_reader::get_repo_status,
            repo_reader::get_stashed_changes,
            repo_reader::get_file_diff,
            repo_reader::get_file_diff_from_stash,
            // Repository modify commands
            repo_manager::create_repo,
            repo_manager::clone_repo,
            repo_manager::tag_branch_tip,
            repo_manager::tag_commit,
            repo_manager::delete_tag,
            repo_manager::checkout_commit,
            repo_manager::checkout_branch,
            repo_manager::rename_branch,
            repo_manager::delete_branch,
            repo_manager::add_to_staging_area,
            repo_manager::remove_from_staging_area,
            repo_manager::discard_changes,
            repo_manager::stash_changes,
            repo_manager::apply_stash,
            repo_manager::drop_stash,
            repo_manager::pop_stash,
            repo_manager::delete_remote,
            repo_manager::add_remote,
            repo_manager::fetch_remote,
            repo_manager::pull_remote,
            repo_manager::push_remote,
            repo_manager::create_branch,
            repo_manager::commit,
            repo_manager::revert_commit,
            repo_manager::merge_branch,
            repo_manager::rebase_branch,
            // Repository Watcher commands
            repo_watcher::setup_watchers,
            repo_watcher::stop_git_watcher,
            // Debug functions
            #[cfg(debug_assertions)]
            repo_guard::reset,
        ])
        .setup(|app| {
            let webview = get_main_webview(app)?;

            if let Err(e) = setup_logging(app) {
                return Err(handle_setup_error(e));
            }
            if let Err(e) = init_app_paths(app) {
                return Err(handle_setup_error(e));
            }
            if let Err(e) = set_app_globals(&webview) {
                return Err(handle_setup_error(e));
            }
            if let Err(e) = setup_app_theme(&webview) {
                return Err(handle_setup_error(e));
            }
            trace!("Setup finished!");

            Ok(())
        })
        .run(tauri::generate_context!());

    if let Err(e) = run_result {
        let msg = format!("Error while running GitTaur: {e}");
        error!("{msg}");
        tinyfiledialogs::message_box_ok(
            "GitTaur Error",
            &msg,
            tinyfiledialogs::MessageBoxIcon::Error,
        );
        std::process::exit(1);
    }
}
