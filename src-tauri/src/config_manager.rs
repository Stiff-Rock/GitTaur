use crate::types::config::*;
use git2::Config;
use log::{error, trace};
use std::{
    fs::{metadata, write, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{LazyLock, Mutex, MutexGuard, OnceLock},
};
use tauri::command;

pub static CONFIGUTARION: LazyLock<Mutex<Configuration>> =
    LazyLock::new(|| Mutex::new(Configuration::default()));

pub static CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();

#[command]
pub fn save_config(new_config: Configuration) -> Result<(), String> {
    let mut config = CONFIGUTARION.lock().map_err(|e| e.to_string())?;
    *config = new_config;

    let json_data = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    let config_path = if let Some(path) = CONFIG_PATH.get() {
        path
    } else {
        return Err(format!("Unable to obtain config path during saving"));
    };

    write(config_path, json_data).map_err(|e| format!("Failed to save: {}", e))?;

    Ok(())
}

#[command]
pub fn get_config() -> Result<Configuration, String> {
    Ok(config()?.to_owned())
}
#[command]
pub async fn set_global_git_user_id(username: String, email: String) -> Result<(), String> {
    let mut global_config = Config::open_default()
        .map_err(|e| {
            let msg = format!("Error while opening git config: {e}");
            error!("{msg}");
            msg
        })?
        .open_global()
        .map_err(|e| {
            let msg = format!("Error while opening global git config: {e}");
            error!("{msg}");
            msg
        })?;

    if !username.is_empty() {
        global_config
            .set_str("user.name", &username)
            .map_err(|e| e.to_string())?;
    }

    if !email.is_empty() {
        global_config
            .set_str("user.email", &email)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn config() -> Result<MutexGuard<'static, Configuration>, String> {
    Ok(CONFIGUTARION
        .lock()
        .map_err(|e| format!("Could not obtain configuraion lock: {e}"))?)
}

pub fn load_config() -> Result<String, String> {
    trace!("Loading config");

    let path = if let Some(path) = CONFIG_PATH.get() {
        path
    } else {
        return Err(format!("Unable to obtain config path during load"));
    };

    let config_path = Path::new(path);

    // If the configuration file is empty, craete a new empty one, if not, load it
    let mut config = config()?;
    if !config_path.exists() || metadata(config_path).map(|m| m.len() == 0).unwrap_or(true) {
        trace!("Configuration file doest not exist, creating...");

        let config_json: String = serde_json::to_string_pretty(&*config)
            .map_err(|e| format!("Failed to serialize configuration: {e}"))?;

        let mut file =
            File::create(path).map_err(|e| format!("Failed to create configuration.json: {e}"))?;
        file.write_all(config_json.as_bytes())
            .map_err(|e| format!("Failed to write default configuration JSON content: {e}"))?;

        *config = Configuration::default();
    } else {
        trace!("Reading configuration json file...");

        let mut file = File::open(config_path)
            .map_err(|e| format!("Error while reading configuration file: {e}"))?;

        let mut config_json: String = String::new();
        file.read_to_string(&mut config_json)
            .map_err(|e| format!("Error reading configuration file contents: {e}"))?;

        *config = if let Ok(mut config_value) = serde_json::from_str::<Configuration>(&config_json)
        {
            trace!("Validating deserialized configuration...");
            config_value.verify_config();
            trace!("Finished configuration validation");
            config_value
        } else {
            // If malformed config json, use default values
            error!("Malformed configuration JSON, using default values");

            tinyfiledialogs::message_box_ok(
                "Configuration Error",
                "Your configuration file was corrupted or malformed and has been restored to defaults",
                tinyfiledialogs::MessageBoxIcon::Warning,
            );

            Configuration::default()
        };

        match config.save(config_path.to_path_buf()) {
            Ok(_) => trace!("Configuration loading complete!"),
            Err(e) => error!("{e}"),
        }
    }

    Ok(serde_json::to_string(&*config)
        .map_err(|e| format!("Error during setup config serialization - {e}"))?)
}
