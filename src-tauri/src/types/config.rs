use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    En,
    Es,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    // General configs
    lang: Language,
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
            lang: Language::En,
            date_format: "YYYY-MM-DD".to_string(),
            max_commits: 20000,
            terminal_app: String::new(),
            username: String::new(),
            email: String::new(),
            theme: String::new(),
            accent_color: String::new(),
        }
    }
}
