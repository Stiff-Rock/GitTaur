use crate::Tab;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, metadata, File},
    io::{Read, Write},
    path::Path,
    sync::{LazyLock, Mutex, MutexGuard},
};
use tauri::command;

static WORKSPACE: LazyLock<Mutex<Workspace>> = LazyLock::new(|| Mutex::new(Workspace::new()));

const WORKSPACE_PATH: &str = "./workspace.json";

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    #[serde(with = "indexmap::map::serde_seq")]
    pub tabs: IndexMap<String, Tab>,
    pub active_tab: String,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDTO {
    pub tabs: Vec<(String, Tab)>,
    pub active_tab: String,
}

impl Workspace {
    pub fn new() -> Self {
        Self {
            tabs: IndexMap::new(),
            active_tab: String::new(),
        }
    }
}

#[command]
pub fn save_workspace(workspace_dto: WorkspaceDTO) -> Result<(), String> {
    let mut workspace = WORKSPACE.lock().map_err(|e| e.to_string())?;

    *workspace = Workspace {
        tabs: workspace_dto.tabs.into_iter().collect(),
        active_tab: workspace_dto.active_tab.clone(),
    };

    let json_data = serde_json::to_string_pretty(&*workspace).map_err(|e| e.to_string())?;
    fs::write(WORKSPACE_PATH, json_data).map_err(|e| format!("Failed to save: {}", e))?;

    Ok(())
}

#[command]
pub fn get_workspace() -> WorkspaceDTO {
    let workspace = workspace();
    WorkspaceDTO {
        tabs: workspace.tabs.clone().into_iter().collect(),
        active_tab: workspace.active_tab.clone(),
    }
}

pub fn workspace() -> MutexGuard<'static, Workspace> {
    WORKSPACE.lock().unwrap()
}

//TODO: THIS DOES NOT ACTUALLY HAVE TO OPEN THE REPO IN GIT2, IT HAS TO REGISTER AND CACHE IT AS A
//RECENTLY OPENED ONE
#[command]
pub fn open_repo(repo_path: String) -> Result<String, String> {
    if workspace().tabs.contains_key(&repo_path) {
        return Ok("".to_string());
    }

    Ok("IMPLEMENT".to_string())
}

//TODO: FOR RELEASE Use Tauri's App Data Directory
pub fn restore_workspace() -> Workspace {
    let path = Path::new(WORKSPACE_PATH);

    // If the workspace file is empty, craete a new empty one, if not, load it
    let mut workspace = workspace();
    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let json_data = serde_json::to_string_pretty(&*workspace)
            .map_err(|e| e.to_string())
            .expect("Failed to serialize workspace");

        let mut file = File::create(WORKSPACE_PATH).expect("Failed to create workspace.json");
        file.write_all(json_data.as_bytes())
            .expect("Failed to write default JSON content");

        *workspace = Workspace::new();
    } else {
        let mut file = File::open(path).expect("Error while reading workspace file");

        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .expect("Error reading workspace file contents");

        *workspace = serde_json::from_str(&contents).expect("Failed to load workspace info");
    }

    workspace.clone()
}
