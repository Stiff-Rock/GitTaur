use serde::{Deserialize, Serialize};
use std::{
    fs::{self, metadata, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{LazyLock, Mutex, MutexGuard, OnceLock},
};
use tauri::command;

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    // General configs
    lang: String,
    date_format: String,
    max_commits: u32,
    terminal_app: String,

    // Git configs
    username: String,
    email: String,

    // UI Customization
    theme: String,
    accent_color: String,
}

impl Configuration {
    pub fn default() -> Self {
        Self {
            lang: String::new(),
            date_format: String::new(),
            max_commits: u32::MAX,
            terminal_app: String::new(),
            username: String::new(),
            email: String::new(),
            theme: String::new(),
            accent_color: String::new(),
        }
    }
}

pub static CONFIGUTARION: LazyLock<Mutex<Configuration>> =
    LazyLock::new(|| Mutex::new(Configuration::default()));

pub static CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();

#[command]
pub fn save_config(new_config: Configuration) -> Result<(), String> {
    let mut config = CONFIGUTARION.lock().map_err(|e| e.to_string())?;
    *config = new_config;

    let json_data = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    fs::write(CONFIG_PATH.get().unwrap(), json_data)
        .map_err(|e| format!("Failed to save: {}", e))?;

    Ok(())
}

#[command]
pub fn get_config() -> Configuration {
    config().to_owned()
}

pub fn config() -> MutexGuard<'static, Configuration> {
    CONFIGUTARION.lock().unwrap()
}

pub fn load_config() -> String {
    let path = Path::new(CONFIG_PATH.get().unwrap());

    // If the workspace file is empty, craete a new empty one, if not, load it
    let mut config = config();
    if !path.exists() || metadata(path).map(|m| m.len() == 0).unwrap_or(true) {
        let config_json: String = serde_json::to_string_pretty(&*config)
            .map_err(|e| e.to_string())
            .expect("Failed to serialize configuration");

        let mut file =
            File::create(CONFIG_PATH.get().unwrap()).expect("Failed to create configuration.json");
        file.write_all(config_json.as_bytes())
            .expect("Failed to write default configuration JSON content");

        *config = Configuration::default();
    } else {
        let mut file = File::open(path).expect("Error while reading configuration file");

        let mut config_json: String = String::new();
        file.read_to_string(&mut config_json)
            .expect("Error reading workspace file contents");

        *config = serde_json::from_str(&config_json).expect("Failed to load workspace info");
    }

    serde_json::to_string(&*config).unwrap_or_else(|e| {
        eprintln!("Error during setup config serialization - {}", e);
        String::from("{}")
    })
}
