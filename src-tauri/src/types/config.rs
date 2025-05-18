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
    pub lang: Language,
    pub date_format: String,
    pub max_commits: u32,
    pub terminal_app: String,

    // Git configs
    pub username: String,
    pub email: String,

    // UI Customization
    pub theme: String,
    pub accent_color: String,
}

impl Configuration {
    pub fn default() -> Self {
        Self {
            lang: Language::En,
            date_format: "YYYY-MM-DD".to_string(),
            max_commits: 20000,
            terminal_app: "".to_string(),
            username: "".to_string(),
            email: "".to_string(),
            theme: "System Default".to_string(),
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

        if self.username.is_empty() {
            self.username = default.username;
        }

        if self.email.is_empty() {
            self.email = default.email;
        }

        if self.theme.is_empty() {
            self.theme = default.theme;
        }

        if self.accent_color.is_empty() {
            self.accent_color = default.accent_color;
        }
    }
}
