use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    En,
    Es,
    Unknown,
}

impl Language {
    pub fn as_str(&self) -> &'static str {
        match self {
            Language::En => "en",
            Language::Es => "es",
            Language::Unknown => "en",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "en" => Language::En,
            "es" => Language::Es,
            _ => Language::Unknown,
        }
    }
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
