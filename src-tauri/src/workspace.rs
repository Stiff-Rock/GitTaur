use crate::Tab;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub tabs: HashMap<String, Tab>,
    pub active_tab: String,
}

impl Workspace {
    pub fn add_tab(&mut self, label: String, repo_path: String) -> String {
        let new_tab = Tab {
            label,
            repo_path: repo_path.clone(),
        };

        self.tabs.insert(repo_path.clone(), new_tab);

        repo_path
    }
}
