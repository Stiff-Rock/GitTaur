use crate::Tab;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub tabs: Vec<(String, Tab)>,
    pub active_tab: String,
}
