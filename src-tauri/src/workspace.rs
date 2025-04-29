use crate::Tab;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, metadata, File},
    io::{Read, Write},
    path::Path,
    sync::{LazyLock, Mutex},
};
use tauri::command;

static WORKSPACE: LazyLock<Mutex<Workspace>> = LazyLock::new(|| Mutex::new(Workspace::new()));

const WORKSPACE_PATH: &str = "./workspace.json";

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub tabs: IndexMap<String, Tab>,
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
pub fn save_workspace(workspace: Workspace) -> Result<(), String> {
    let mut workspace_lock = WORKSPACE.lock().map_err(|e| e.to_string())?;
    *workspace_lock = workspace.clone();

    let json_data = serde_json::to_string_pretty(&workspace).map_err(|e| e.to_string())?;
    fs::write(WORKSPACE_PATH, json_data).map_err(|e| format!("Failed to save: {}", e))?;

    Ok(())
}

//TODO: MAYBE THIS DOESNT MAKE SENSE ANY MORE
#[command]
pub fn get_workspace() -> Workspace {
    let workspace_lock = WORKSPACE.lock().unwrap();
    workspace_lock.clone()
}

//TODO: THIS DOES NOT ACTUALLY HAVE TO OPEN THE REPO IN GIT2, IT HAS TO REGISTER AND CACHE IT AS A
//RECENTLY OPENED ONE
#[command]
pub fn open_repo(repo_path: String) -> Result<String, String> {
    if get_workspace().tabs.contains_key(&repo_path) {
        return Ok("".to_string());
    }

    Ok("IMPLEMENT".to_string())
}

//TODO: FOR RELEASE Use Tauri's App Data Directory
pub fn restore_workspace() {
    let path = Path::new(WORKSPACE_PATH);

    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let workspace_instance = WORKSPACE.lock().unwrap();

        let json_data = serde_json::to_string_pretty(&*workspace_instance)
            .map_err(|e| e.to_string())
            .expect("Failed to serialize workspace");

        let mut file = File::create(WORKSPACE_PATH).expect("Failed to create workspace.json");
        file.write_all(json_data.as_bytes())
            .expect("Failed to write default JSON content");
    } else {
        let mut file = File::open(path).expect("Error while reading workspace file");

        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .expect("Error reading workspace file contents");

        let mut workspace = match WORKSPACE.lock() {
            Ok(guard) => guard,
            Err(e) => {
                println!("Could not restore previous workspace session - {}", e);
                return;
            }
        };
        *workspace = serde_json::from_str(&contents).expect("Failed to load workspace info");
    }
}
