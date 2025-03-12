use crate::Tab;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub tabs: HashMap<String, Tab>,
    pub active_tab: String,
}
