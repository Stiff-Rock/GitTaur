use crate::{repo_manager::is_repo, types::workspace::*};
use log::{error, trace, warn};
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
    let mut workspace = workspace();
    *workspace = workspace_dto.into_workspace();

    let workspace_path = WORKSPACE_PATH
        .get()
        .expect("Unable to obtain workspace during saving");
    workspace.save(workspace_path.to_path_buf())?;

    Ok(())
}

#[command]
pub fn get_workspace() -> WorkspaceDTO {
    workspace().to_dto()
}

pub fn workspace() -> MutexGuard<'static, Workspace> {
    WORKSPACE.lock().expect("Could not obtain workspace lock")
}

//TODO: THIS DOES NOT ACTUALLY HAVE TO OPEN THE REPO IN GIT2, IT HAS TO REGISTER AND CACHE IT AS A RECENTLY OPENED ONE
#[command]
pub fn open_repo(repo_path: String) -> Result<String, String> {
    if workspace().tabs.contains_key(&repo_path) {
        return Ok("".to_string());
    }

    trace!("repo_path: {}", repo_path);
    if !is_repo(&repo_path, false)? {
        return Err("Error: the selected directory is not a repository".to_string());
    }

    Ok("".to_string())
}

pub fn restore_workspace() -> String {
    let workspace_path = WORKSPACE_PATH
        .get()
        .expect("Unable to obtain workspace during restoration");

    let path = Path::new(&workspace_path);

    // If the workspace file is empty, craete a new empty one, if not, load it
    let mut workspace = workspace();
    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let workspace_json: String = serde_json::to_string_pretty(&*workspace)
            .map_err(|e| e.to_string())
            .expect("Failed to serialize workspace");

        let mut file = File::create(workspace_path).expect("Failed to create workspace.json");
        file.write_all(workspace_json.as_bytes())
            .expect("Failed to write default workspace JSON content");

        *workspace = Workspace::new();
    } else {
        let mut file = File::open(path).expect("Error while reading workspace file");

        let mut workspace_json: String = String::new();
        file.read_to_string(&mut workspace_json)
            .expect("Error reading workspace file contents");

        *workspace = serde_json::from_str(&workspace_json).expect("Failed to load workspace info");
    }

    workspace.validate();
    match workspace.save(path.to_path_buf()) {
        Ok(_) => {}
        Err(e) => warn!("{e}"),
    }

    serde_json::to_string(&workspace.to_dto()).unwrap_or_else(|e| {
        error!("Error during setup dto serialization - {}", e);
        String::from("{}")
    })
}
