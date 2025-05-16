use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{mpsc::channel, Arc, LazyLock, Mutex},
    thread::spawn,
    time::{Duration, Instant},
};
use tauri::{command, AppHandle, Emitter};
use RecursiveMode::{NonRecursive, Recursive};

static WATCHER_STORE: LazyLock<Arc<Mutex<HashMap<String, RecommendedWatcher>>>> =
    LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

static UNWATCHED_DIRS_MAP: LazyLock<
    Arc<Mutex<HashMap<String, Vec<(PathBuf, bool, RecursiveMode)>>>>,
> = LazyLock::new(|| Arc::new(Mutex::new(HashMap::new())));

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RepoEvents {
    head_event: String,
    fetch_event: String,
    status_event: String,
}

#[command]
pub async fn setup_watchers(
    app_handle: AppHandle,
    repo_path: String,
    repo_events: RepoEvents,
) -> Result<(), String> {
    let mut watchers = WATCHER_STORE.lock().unwrap();
    if watchers.contains_key(&repo_path) {
        return Ok(());
    }

    let base_path = PathBuf::from(&repo_path);
    let git_path = base_path.join(".git");
    let mut paths_to_watch: Vec<(PathBuf, bool, RecursiveMode)> = vec![
        (base_path, false, Recursive),
        (git_path.join("HEAD"), false, NonRecursive),
        (git_path.join("index"), false, NonRecursive),
    ];

    let mut unwatched_dirs_map = UNWATCHED_DIRS_MAP.lock().unwrap();
    let unwatched_dirs = unwatched_dirs_map
        .entry(repo_path.clone())
        .or_insert_with(Vec::new);

    let mut has_unwatched_dirs = false;

    let dynamic_paths: Vec<(PathBuf, bool, RecursiveMode)> = vec![
        (git_path.join("FETCH_HEAD"), true, NonRecursive),
        (git_path.join("refs").join("remotes"), true, Recursive),
    ];

    for entry in &dynamic_paths {
        let (path, is_dynamic, _) = entry;

        if *is_dynamic && !path.exists() {
            unwatched_dirs.push(entry.clone());
            has_unwatched_dirs = true;
        } else {
            paths_to_watch.push(entry.clone());
        }
    }

    let (tx, rx) = channel();
    let event_app_handle = app_handle.clone();

    let repo_path_str = repo_path.clone().replace('\\', "/");
    //TODO: FILTER THE .git from the repo_path
    let mut watcher = RecommendedWatcher::new(
        move |result: Result<notify::Event, notify::Error>| {
            if let Ok(event) = result {
                if let Some(path) = event.paths.first() {
                    let path_str = path.to_string_lossy().replace('\\', "/");

                    if !has_unwatched_dirs && path_str.contains("/.git/") {
                        return;
                    };

                    println!("path: {}\nstr:{}", path_str, repo_path_str);
                    if path.ends_with("HEAD") && !path.ends_with("FETCH_HEAD") {
                        println!("HEAD");
                        tx.send(("head", ())).ok();
                    } else if path.ends_with("FETCH_HEAD") || path_str.contains("/refs/remotes/") {
                        println!("FETCH");
                        tx.send(("fetch", ())).ok();
                    } else if path.ends_with("index")
                        || path.ends_with("index.lock")
                        || (path_str.contains(&repo_path_str) && !path_str.contains("/.git/"))
                    {
                        println!("STATUS");
                        tx.send(("status", ())).ok();
                    } else if path_str.contains("/.git/") {
                        println!("GIT");
                        tx.send((".git", ())).ok();
                    }
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    for (path, _, recursive_mode) in paths_to_watch {
        watcher
            .watch(&path, recursive_mode)
            .map_err(|e| e.to_string())?;
    }

    watchers.insert(repo_path.clone(), watcher);

    let RepoEvents {
        head_event,
        fetch_event,
        status_event,
    } = repo_events;

    spawn(move || {
        let last_emit = Instant::now() - Duration::from_secs(3);
        let mut last_general_emit = last_emit;
        let mut last_head_emit = last_emit;
        let mut last_fetch_emit = last_emit;
        let mut last_status_emit = last_emit;

        while let Ok((event_type, ())) = rx.recv() {
            let now = Instant::now();

            let debounce_interval = Duration::from_millis(500);
            match event_type {
                //TODO: CHECK IF THIS MECHANISM REALLY WORKS
                ".git" => {
                    if now.duration_since(last_general_emit) > debounce_interval {
                        setup_unwatched_dirs(&repo_path);
                        last_general_emit = now;
                    }
                }
                "head" => {
                    if now.duration_since(last_head_emit) > debounce_interval {
                        event_app_handle.emit(&head_event, ()).ok();
                        last_head_emit = now;
                    }
                }
                "fetch" => {
                    if now.duration_since(last_fetch_emit) > debounce_interval {
                        event_app_handle.emit(&fetch_event, ()).ok();
                        last_fetch_emit = now;
                    }
                }
                "status" => {
                    if now.duration_since(last_status_emit) > debounce_interval {
                        event_app_handle.emit(&status_event, ()).ok();
                        last_status_emit = now;
                    }
                }
                _ => {}
            }
        }
    });

    Ok(())
}

fn setup_unwatched_dirs(repo_path: &String) {
    let mut unwatched_dirs_map = UNWATCHED_DIRS_MAP.lock().unwrap();
    let entries = unwatched_dirs_map.get_mut(repo_path).unwrap();

    let mut watcher_store = WATCHER_STORE.lock().unwrap();
    let watcher = watcher_store.get_mut(repo_path).unwrap();

    let count = entries.len();
    for i in (0..count).rev() {
        let (path, _, recursive_mode) = &entries[i];

        if let Err(e) = watcher.watch(path, *recursive_mode) {
            eprintln!("Failed to watch path {}: {}", path.display(), e);
            continue;
        }

        entries.remove(i);
    }

    if entries.is_empty() {
        let git_path = PathBuf::from(repo_path).join(".git");

        if let Err(e) = watcher.unwatch(&git_path) {
            eprintln!("Failed to unwatch .git directory: {}", e);
            return;
        }

        unwatched_dirs_map.remove(repo_path);
    }
}

#[command]
pub async fn stop_git_watcher(repo_path: String) -> Result<(), String> {
    let removed = WATCHER_STORE.lock().unwrap().remove(&repo_path);

    if !removed.is_some() {
        eprintln!("No watcher found for {}", repo_path);
    }

    Ok(())
}
