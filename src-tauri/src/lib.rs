// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use git2::Repository;
use tauri::command;

#[command]
fn create_repository(path: String) -> String {
    match Repository::init(&path) {
        Ok(repo) => {
            print_info(repo);
            format!("Repositorio creado en: {}", path)
        }
        Err(e) => {
            format!("Error al crear repositorio: {}", e)
        }
    }
}

#[command]
fn open_repository(path: String) -> String {
    match Repository::open(&path) {
        Ok(repo) => {
            print_info(repo);
            format!("Repositorio abierto en: {}", path)
        }
        Err(e) => format!("Error abriendo repositorio: {}", e),
    }
}

#[command]
fn clone_repository(path: String, repo_url: String) -> String {
    match Repository::clone(&repo_url, &path) {
        Ok(repo) => {
            print_info(repo);
            format!("Repositorio clonado en: {}", path)
        }
        Err(e) => format!("Error al clonar repositorio: {}", e),
    }
}

fn print_info(repo: Repository) {
    let mut info = String::new();

    info.push_str("---------------------\n");

    // 1. Current branch
    if let Ok(head) = repo.head() {
        info.push_str(&format!(
            "🌿 Branch: {}\n",
            head.shorthand().unwrap_or("unknown")
        ));

        // 2. Last commit
        if let Ok(commit) = head.peel_to_commit() {
            info.push_str(&format!(
                "📌 Last commit: {}\n",
                commit.summary().unwrap_or("no message")
            ));
            info.push_str(&format!("👤 By: {}\n", commit.author()));
        }
    }

    // 3. Modified files
    if let Ok(statuses) = repo.statuses(None) {
        let modified = statuses
            .iter()
            .filter(|e| e.status().is_wt_modified())
            .count();
        info.push_str(&format!("📁 Modified files: {}", modified));
    }

    print!("{}", info);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_repository,
            open_repository,
            clone_repository
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
