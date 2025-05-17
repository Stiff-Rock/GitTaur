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
}

impl Workspace {
    pub fn new() -> Self {
        Self {
            tabs: IndexMap::new(),
            active_tab: String::new(),
        }
    }

    pub fn to_dto(&self) -> WorkspaceDTO {
        WorkspaceDTO {
            tabs: self.tabs.clone().into_iter().collect(),
            active_tab: self.active_tab.clone(),
        }
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDTO {
    pub tabs: Vec<(String, Tab)>,
    pub active_tab: String,
}

impl WorkspaceDTO {
    pub fn into_workspace(self) -> Workspace {
        Workspace {
            tabs: self.tabs.into_iter().collect(),
            active_tab: self.active_tab,
        }
    }
}
