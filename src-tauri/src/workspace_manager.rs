use crate::{repo_manager::is_repo, types::workspace::*};
use log::{trace, warn};
use std::{
    fs::{metadata, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{LazyLock, Mutex, MutexGuard, OnceLock},
};
use tauri::command;

static WORKSPACE: LazyLock<Mutex<Workspace>> = LazyLock::new(|| Mutex::new(Workspace::new()));

pub static WORKSPACE_PATH: OnceLock<PathBuf> = OnceLock::new();

#[command]
pub fn save_workspace(workspace_dto: WorkspaceDTO) -> Result<(), String> {
    let mut workspace = workspace()?;
    *workspace = workspace_dto.into_workspace();

    let workspace_path = if let Some(path) = WORKSPACE_PATH.get() {
        path
    } else {
        return Err("Unable to obtain workspace during restoration".to_string());
    };

    workspace.save(workspace_path.to_path_buf())?;

    Ok(())
}

#[command]
pub fn get_workspace() -> Result<WorkspaceDTO, String> {
    Ok(workspace()?.to_dto())
}

pub fn workspace() -> Result<MutexGuard<'static, Workspace>, String> {
    Ok(WORKSPACE
        .lock()
        .map_err(|e| format!("Could not obtain workspace lock: {e}"))?)
}

//TODO: THIS DOES NOT ACTUALLY HAVE TO OPEN THE REPO IN GIT2, IT HAS TO REGISTER AND CACHE IT AS A RECENTLY OPENED ONE
#[command]
pub fn open_repo(repo_path: String) -> Result<String, String> {
    if workspace()?.tabs.contains_key(&repo_path) {
        return Ok("".to_string());
    }

    trace!("repo_path: {}", repo_path);
    if !is_repo(&repo_path, false)? {
        return Err("Error: the selected directory is not a repository".to_string());
    }

    Ok("".to_string())
}

pub fn restore_workspace() -> Result<String, String> {
    let workspace_path = if let Some(path) = WORKSPACE_PATH.get() {
        path
    } else {
        return Err("Unable to obtain workspace during restoration".to_string());
    };

    let path = Path::new(&workspace_path);

    // If the workspace file is empty, craete a new empty one, if not, load it
    let mut workspace = workspace()?;
    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let workspace_json: String = serde_json::to_string_pretty(&*workspace)
            .map_err(|e| format!("Failed to serialize workspace: {e}"))?;

        let mut file = File::create(workspace_path)
            .map_err(|e| format!("Failed to create workspace.json: {e}"))?;
        file.write_all(workspace_json.as_bytes())
            .map_err(|e| format!("Failed to write default workspace JSON content: {e}"))?;

        *workspace = Workspace::new();
    } else {
        let mut file =
            File::open(path).map_err(|e| format!("Error while reading workspace file: {e}"))?;

        let mut workspace_json: String = String::new();
        file.read_to_string(&mut workspace_json)
            .map_err(|e| format!("Error reading workspace file contents: {e}"))?;

        *workspace = serde_json::from_str(&workspace_json)
            .map_err(|e| format!("Failed to load workspace info: {e}"))?;
    }

    workspace.validate();
    match workspace.save(path.to_path_buf()) {
        Ok(_) => {}
        Err(e) => warn!("{e}"),
    }

    Ok(serde_json::to_string(&workspace.to_dto())
        .map_err(|e| format!("Error during setup dto serialization - {e}"))?)
}
