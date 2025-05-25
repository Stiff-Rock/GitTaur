use std::path::PathBuf;

use dirs::{document_dir, home_dir};
use git2::Config;
use serde::{Deserialize, Serialize};
use tauri_plugin_os::locale;

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    En,
    Es,
}

impl Default for Language {
    fn default() -> Self {
        Language::En
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::System
    }
}

impl Language {
    pub fn from_code(lang_code: &str) -> Self {
        match lang_code.to_lowercase().as_str() {
            "es" => Language::Es,
            _ => Language::En,
        }
    }

    pub fn from_system_locale() -> Self {
        let locale = locale().unwrap_or_else(|| String::from("en"));
        let lang_code = locale
            .split(&['-', '_', '.'])
            .next()
            .unwrap_or("en")
            .to_lowercase();

        Self::from_code(&lang_code)
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    // General configs
    #[serde(default)]
    pub lang: Language,
    pub date_format: String,
    pub max_commits: u32,
    pub terminal_app: String,

    // Git configs
    pub username: String,
    pub email: String,
    pub clone_path: String, //TODO:

    // UI Customization
    #[serde(default)]
    pub theme_config: Theme,
    #[serde(default)]
    pub theme_value: Theme,
    pub accent_color: String,
}

impl Configuration {
    pub fn get_git_user_info() -> (String, String) {
        match Config::open_default() {
            Ok(config) => {
                let username = config
                    .get_string("user.name")
                    .unwrap_or_else(|_| String::new());

                let email = config
                    .get_string("user.email")
                    .unwrap_or_else(|_| String::new());

                (username, email)
            }
            Err(_) => (String::new(), String::new()),
        }
    }

    fn get_default_clone_path() -> String {
        let path = document_dir().unwrap_or(home_dir().unwrap_or(PathBuf::new()));

        path.to_string_lossy().into_owned()
    }

    pub fn default() -> Self {
        let (git_username, git_email) = Self::get_git_user_info();

        Self {
            lang: Language::from_system_locale(),
            date_format: "YYYY-MM-DD".to_string(),
            max_commits: 1000,
            terminal_app: "".to_string(),
            username: git_username,
            email: git_email,
            clone_path: Self::get_default_clone_path(),
            theme_config: Theme::System,
            theme_value: Theme::System,
            accent_color: "#50FA7B".to_string(),
        }
    }

    pub fn verify_config(&mut self) {
        let default = Self::default();

        if self.max_commits == 0 {
            self.max_commits = default.max_commits;
        }

        if self.date_format.is_empty() {
            self.date_format = default.date_format;
        }

        if self.terminal_app.is_empty() {
            self.terminal_app = default.terminal_app;
        }

        let (git_username, git_email) = Self::get_git_user_info();

        if self.username != git_username {
            self.username = default.username;
        }

        if self.email != git_email {
            self.email = default.email;
        }

        if self.accent_color.is_empty() {
            self.accent_color = default.accent_color;
        }
    }
}
