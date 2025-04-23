use std::collections::HashMap;

use git2::Repository;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitLog {
    pub refs: Vec<String>,
    pub hash: String,
    pub hash_abbrev: String,
    pub tree: String,
    pub tree_abbrev: String,
    pub parents: Vec<String>,
    pub parents_abbrev: Vec<String>,
    pub author: UserInfo,
    pub committer: UserInfo,
    pub subject: String,
    pub body: String,
    pub notes: String,
    pub stats: Vec<FileStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub name: String,
    pub email: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileStats {
    pub additions: Option<u32>,
    pub deletions: Option<u32>,
    pub file: String,
}

#[command()]
pub fn get_repo_json(repo_path: String) -> Result<Vec<CommitLog>, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Falied to open repository {}", e.to_string()))?;

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Failed to create revision walker: {}", e))?;

    revwalk
        .push_head()
        .map_err(|e| format!("Failed to push HEAD: {}", e))?;
    revwalk
        .set_sorting(git2::Sort::TIME)
        .map_err(|e| format!("Failed to set sorting: {}", e))?;

    // Build refs map
    let commit_to_refs_map =
        build_commit_refs_map(&repo).map_err(|e| format!("Failed to build refs map: {}", e))?;

    let mut repo_json: Vec<CommitLog> = Vec::new();
    for oid in revwalk {
        let oid = oid.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

        let refs = commit_to_refs_map
            .get(&oid.to_string())
            .cloned()
            .unwrap_or_default();

        let hash = oid.to_string();

        let hash_abbrev = hash[..7].to_string();

        let tree = commit.tree_id().to_string();

        let tree_abbrev = tree[..7].to_string();

        let (mut parents, mut parents_abbrev) = (Vec::new(), Vec::new());
        for parent in commit.parents() {
            let oid = parent.id().to_string();
            parents.push(oid.clone());
            parents_abbrev.push(oid[..7].to_string());
        }

        let author = commit.author();
        let author_name = author.name().unwrap_or("Uknown").to_string();
        let author_email = author.email().unwrap_or("Uknown").to_string();

        let committer = commit.committer();
        let committer_name = committer.name().unwrap_or("Unknown").to_string();
        let committer_email = committer.email().unwrap_or("Unknown").to_string();

        let timestamp = commit.time().seconds();

        let author = UserInfo {
            name: author_name,
            email: author_email,
            timestamp,
        };

        let committer = UserInfo {
            name: committer_name,
            email: committer_email,
            timestamp,
        };

        let full_message = commit.message().unwrap_or("").to_string();
        let mut lines = full_message.splitn(2, "\n\n");
        let subject = lines
            .next()
            .unwrap_or("## No message provided ##")
            .trim()
            .to_string();
        let body = lines.next().unwrap_or("").trim().to_string();

        //NOTE: FOR NOW, IM NOT DOING THE NOTES AND STATS
        let notes: String = String::new();

        let stats: Vec<FileStats> = Vec::new();

        let commit_log = CommitLog {
            refs,
            hash,
            hash_abbrev,
            tree,
            tree_abbrev,
            parents,
            parents_abbrev,
            author,
            committer,
            subject,
            body,
            notes,
            stats,
        };

        repo_json.push(commit_log);
    }

    Ok(repo_json)
}

fn build_commit_refs_map(repo: &Repository) -> Result<HashMap<String, Vec<String>>, git2::Error> {
    let mut commit_to_refs: HashMap<String, Vec<String>> = HashMap::new();

    let refs = repo.references()?;
    for reference in refs {
        let reference = reference?;

        if let Some(target_id) = reference.target() {
            let target_str = target_id.to_string();

            if let Some(name) = reference.name() {
                let ref_name = name
                    .strip_prefix("refs/heads/")
                    .or_else(|| name.strip_prefix("heads/"))
                    .or_else(|| name.strip_prefix("refs/remotes/"))
                    .or_else(|| name.strip_prefix("remotes/"))
                    .or_else(|| name.strip_prefix("refs/tags/"))
                    .or_else(|| name.strip_prefix("refs/"))
                    .unwrap_or(name)
                    .to_string();

                commit_to_refs
                    .entry(target_str)
                    .or_insert_with(Vec::new)
                    .push(ref_name);
            }
        }
    }

    Ok(commit_to_refs)
}
