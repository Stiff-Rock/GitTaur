use crate::Tab;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub tabs: IndexMap<String, Tab>,
    pub active_tab: String,
}
