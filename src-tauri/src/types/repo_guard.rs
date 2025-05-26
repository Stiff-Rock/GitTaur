use log::info;
use std::{
    collections::HashSet,
    sync::{Condvar, LazyLock, Mutex},
};
use tauri::command;

static ACTIVE_REPOS: LazyLock<(Mutex<HashSet<String>>, Condvar)> =
    LazyLock::new(|| (Mutex::new(HashSet::new()), Condvar::new()));

pub struct RepoGuard {
    repo_path: String,
}

impl RepoGuard {
    pub fn new(repo_path: &String, wait: bool) -> Result<Option<Self>, String> {
        let mut active_repos_set = match ACTIVE_REPOS.0.lock() {
            Ok(guard) => guard,
            Err(err) => {
                let err_msg =
                    format!("Error checking if repo is busy: HashSet mutex poisoned - {err}");
                eprintln!("{}", err_msg);
                return Err(err_msg);
            }
        };

        // If repo is available, acquire it immediately
        if !active_repos_set.contains(repo_path) {
            active_repos_set.insert(repo_path.clone());
            return Ok(Some(RepoGuard {
                repo_path: repo_path.clone(),
            }));
        }

        // If repo is in use and we don't want to wait, return None
        if !wait {
            return Ok(None);
        }

        // Wait for the repo to become available
        let condvar = &ACTIVE_REPOS.1;

        match condvar.wait_while(active_repos_set, |set| set.contains(repo_path)) {
            Ok(mut guard) => {
                guard.insert(repo_path.clone());
                Ok(Some(RepoGuard {
                    repo_path: repo_path.clone(),
                }))
            }
            Err(e) => Err(format!(
                "Error obtaining mutex of repo {repo_path}: Poisoned mutex - {e}"
            )),
        }
    }
}

impl Drop for RepoGuard {
    fn drop(&mut self) {
        let mut active_repos = match ACTIVE_REPOS.0.lock() {
            Ok(guard) => guard,
            Err(err) => {
                eprintln!(
                    "Error releasing repository lock: HashSet mutex poisoned - {}",
                    err
                );
                return;
            }
        };

        active_repos.remove(&self.repo_path);

        let condvar = &ACTIVE_REPOS.1;

        condvar.notify_all();
    }
}

#[cfg(debug_assertions)]
#[command]
pub async fn reset() -> Result<(), String> {
    info!("---Resetting ACTIVE_REPOS state---");

    match ACTIVE_REPOS.0.lock() {
        Ok(mut active_repos) => {
            active_repos.clear();
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}
