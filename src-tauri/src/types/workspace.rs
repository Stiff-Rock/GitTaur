use std::{
    fs::write,
    path::{Path, PathBuf},
};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Tab {
    pub label: String,
    pub repo_path: String,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    #[serde(with = "indexmap::map::serde_seq")]
    pub tabs: IndexMap<String, Tab>,
    pub active_tab: String,
    pub recent_repos: Vec<String>,
}

impl Workspace {
    pub fn new() -> Self {
        Self {
            tabs: IndexMap::new(),
            active_tab: String::new(),
            recent_repos: Vec::new(),
        }
    }

    pub fn to_dto(&self) -> WorkspaceDTO {
        WorkspaceDTO {
            tabs: self.tabs.clone().into_iter().collect(),
            active_tab: self.active_tab.clone(),
            recent_repos: self.recent_repos.clone(),
        }
    }

    pub fn validate(&mut self) {
        let active_tab_path = Path::new(&self.active_tab);

        if !active_tab_path.exists() || !active_tab_path.is_dir() {
            self.active_tab = String::new();
        }

        let tabs = self.tabs.clone();
        for (tab_key, _) in tabs {
            let tab_path = Path::new(&tab_key);
            if !tab_path.exists() || !tab_path.is_dir() {
                self.tabs.shift_remove(&tab_key);
            }
        }
    }

    pub fn save(&self, path: PathBuf) -> Result<(), String> {
        let json_data = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Error while saving workspace: {e}"))?;
        write(path, json_data).map_err(|e| format!("Error while saving workspace: {e}"))?;
        Ok(())
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDTO {
    pub tabs: Vec<(String, Tab)>,
    pub active_tab: String,
    pub recent_repos: Vec<String>,
}

impl WorkspaceDTO {
    pub fn into_workspace(self) -> Workspace {
        Workspace {
            tabs: self.tabs.into_iter().collect(),
            active_tab: self.active_tab,
            recent_repos: self.recent_repos,
        }
    }
}
