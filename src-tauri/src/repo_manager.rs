use crate::repo_info::{CommitNode, FileChange, RepoInfo};
use chrono::DateTime;
use git2::{BranchType, Commit, DiffOptions, Oid, Repository, Sort};
use indexmap::IndexMap;
use std::{collections::HashMap, path::Path};

pub struct RepoManager;

impl RepoManager {
    pub fn new() -> Self {
        Self {}
    }

    pub fn init_repo(&self, path: String) -> Result<Repository, String> {
        Repository::init(&path).map_err(|e| format!("Error creating repository: {}", e))
    }

    pub fn open_repo(&self, path: String) -> Result<Repository, String> {
        Repository::open(path).map_err(|e| format!("Error while opening repository: {}", e))
    }

    pub fn clone_repo(&self, path: String, repo_url: String) -> String {
        let clone_path = Path::new(&path);
        match Repository::clone(&repo_url, &clone_path) {
            Ok(_) => "".to_string(),
            Err(e) => {
                println!("Technical error details: {:?}", e);

                return match e.code() {
                git2::ErrorCode::Auth => format!(
                    "Authentication failed for repository:\n{}\n\n\
                    Please check your credentials or SSH keys.",
                    repo_url
                ),
                git2::ErrorCode::NotFound => format!(
                    "The repository was not found at the provided URL:\n{}\n\n\
                    Please ensure the URL is correct and the repository is accessible.",
                    repo_url
                ),
                git2::ErrorCode::Exists => format!(
                    "The target directory already exists at:\n{}\n\n\
                    Please choose a different directory or remove the existing one before cloning.",
                    clone_path.display()
                ),
                git2::ErrorCode::Certificate => {
                    "SSL certificate verification failed. This can be caused by:\n\
                    - Invalid server certificate\n\
                    - System clock mismatch\n\
                    - Corporate network restrictions\n\n\
                    Please check your system's certificate settings or consult your network administrator."
                        .to_string()
                }
                _ => format!(
                    "Failed to clone the repository from:\n{}\n\n\
                    Error details: {}",
                    repo_url,
                    e.message()
                ),
            };
            }
        }
    }

    pub fn get_repo_info(&self, path: String) -> Result<RepoInfo, String> {
        let repo = Repository::open(&path).map_err(|e| e.to_string())?;
        let name = path.to_string();

        // Get the branch that is considered the principal in this repo
        let main_branch: String;
        if repo.head_detached().map_err(|e| e.to_string())? {
            println!("HEAD is detached.");
            main_branch = "master".to_string();
        } else {
            let head = repo.head().map_err(|e| e.to_string())?;
            if let Some(branch_name) = head.shorthand() {
                main_branch = branch_name.to_string();
            } else {
                panic!("\nCould not determine the current branch.");
            }
        }

        let current_branch = match repo.head() {
            Ok(head) => head.name().unwrap_or("Unknown").to_string(),
            Err(_) => "Unknown".to_string(),
        };

        let local_branches = repo
            .branches(Some(git2::BranchType::Local))
            .map_err(|e| e.to_string())?
            .filter_map(|b| b.ok())
            .filter_map(|(b, _)| b.name().ok().flatten().map(|s| s.to_owned()))
            .collect::<Vec<String>>();

        let remotes: HashMap<String, Vec<String>> = Self::get_remote_branches(&repo)?;

        let tags = repo
            .tag_names(None)
            .map_err(|e| e.to_string())?
            .iter()
            .filter_map(|t| t.map(|s| s.to_string()))
            .collect::<Vec<String>>();

        let commit_history = {
            // Gets all branches in repo
            let branches: Vec<_> = repo
                .branches(None)
                .map_err(|e| e.to_string())?
                .filter_map(|b| b.ok())
                .collect();

            // Create revwalk
            let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
            revwalk
                .set_sorting(Sort::TOPOLOGICAL | Sort::TIME)
                .map_err(|e| e.to_string())?;

            // Add branch tips to revwalk
            for (branch, _) in &branches {
                if let Some(oid) = branch.get().target() {
                    revwalk.push(oid).map_err(|e| e.to_string())?;
                }
            }

            // Maps out the commit-children relationship
            let mut children_map: HashMap<Oid, Vec<Oid>> = HashMap::new();
            let mut all_commits = Vec::new();
            for oid in revwalk {
                let oid = oid.map_err(|e| e.to_string())?;
                all_commits.push(oid);

                let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
                let parents: Vec<String> = commit.parent_ids().map(|id| id.to_string()).collect();

                children_map.entry(oid).or_default();

                for parent in &parents {
                    children_map
                        .entry(Oid::from_str(parent).map_err(|e| e.to_string())?)
                        .or_default()
                        .push(oid);
                }
            }

            // Create commit history of composed of CommitNode
            let mut commit_history: IndexMap<String, CommitNode> = IndexMap::new();
            let mut commit_branches: HashMap<Oid, String> = HashMap::new();
            for oid in all_commits {
                let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
                let summary = commit.summary().unwrap_or("Unknown").to_string();
                let parents: Vec<String> = commit.parent_ids().map(|id| id.to_string()).collect();
                let children: Vec<Oid> = children_map.get(&oid).cloned().unwrap_or_else(Vec::new);

                // Determines which one is the branch this commit belongs to for graph making
                let branch_name = {
                    let direct_branches: Vec<String> = branches
                        .iter()
                        .filter_map(|(branch, _)| {
                            branch.get().target().and_then(|tip| {
                                (tip == oid).then(|| branch.name().unwrap().unwrap().to_string())
                            })
                        })
                        .collect();

                    let repo_remotes = repo.remotes().map_err(|e| e.to_string())?;

                    // Check branch via direct refs
                    if !direct_branches.is_empty()
                        && !repo_remotes
                            .iter()
                            .flatten()
                            .any(|remote_name| direct_branches[0].contains(remote_name))
                    {
                        direct_branches[0].clone()

                        // Check if direct branch ref is main branch
                    } else if direct_branches.contains(&main_branch) {
                        main_branch.clone()

                        // Checks branch via children
                    } else if !parents.is_empty() && !children.is_empty() {
                        let index = if children.len() > 1 {
                            let b1 = commit_branches
                                .get(&children[0])
                                .unwrap_or(&"NOT_FOUND".to_string())
                                .clone();

                            let b2 = commit_branches
                                .get(&children[1])
                                .unwrap_or(&"NOT_FOUND".to_string())
                                .clone();

                            if b1.contains(&main_branch) {
                                0
                            } else if b2.contains(&main_branch) {
                                1
                            } else {
                                panic!(
                                        "\nError determining commit's branch name for commit '{}'\n Children: {:#?}\nBRANCHES OBTAINED FROM CHILDREN: [\n{}\n{}\n]\n",
                                        summary, children, b1, b2
                                        );
                            }
                        } else {
                            0
                        };

                        println!("FIRST CHILD: {}", children[index].to_string());

                        commit_branches
                            .get(&children[index])
                            .unwrap_or(&"NOT_FOUND".to_string())
                            .clone()
                    } else {
                        main_branch.clone()
                    }
                };

                //TODO: Get all commits refs despite above (make 'branches' field)
                commit_branches.insert(oid, branch_name.clone());

                let author = commit.author();
                let author_name = author.name().unwrap_or("Unknown").to_string();
                let email = author.email().unwrap_or("Unknown").to_string();

                // Get the subject and body sepparately
                let commit_msg = commit.message().unwrap_or("No commit message");
                let (msg_subject, msg_body) = commit_msg
                    .split_once("\n\n")
                    .map(|(s, b)| (s.trim(), b.trim()))
                    .unwrap_or_else(|| (commit_msg.trim(), ""));
                let subject = msg_subject.to_string();
                let body = msg_body.to_string();

                // Get commit date
                let commit_time = commit.time();
                let timestamp = commit_time.seconds();
                let date_time = DateTime::from_timestamp(timestamp, 0)
                    .ok_or_else(|| "Invalid timestamp".to_string())?;
                let formatted_date = date_time.format("%d/%m/%Y").to_string();

                let node = CommitNode {
                    sha: oid.to_string(),
                    subject,
                    body,
                    author: author_name,
                    email,
                    commit_date: formatted_date,
                    parents,
                    branch: branch_name,
                    refs: Vec::new(), //TODO: MAKE REAL REFS
                };

                commit_history.insert(oid.to_string(), node);
            }

            commit_history
        };

        //TODO: TAGS ARE NOT DISPLAYED
        let repo = RepoInfo {
            name,
            main_branch,
            current_branch,
            local_branches,
            remotes,
            tags,
            commit_history,
        };
        println!("{}", serde_json::to_string_pretty(&repo).unwrap());

        Ok(repo)
    }

    //TODO: I DONT REMEMBER THIS
    fn get_remote_branches(repo: &Repository) -> Result<HashMap<String, Vec<String>>, String> {
        let remote_branches = repo
            .branches(Some(BranchType::Remote))
            .map_err(|e| e.to_string())?;

        let mut remote_branches_map: HashMap<String, Vec<String>> = HashMap::new();
        for branch_entry in remote_branches {
            let (branch, _branch_type) = branch_entry.map_err(|e| e.to_string())?;
            let branch_name = branch
                .name()
                .map_err(|e| e.to_string())?
                .unwrap_or_else(|| {
                    eprintln!(
                        "Warning: Invalid branch name in entry {:?}",
                        branch.name_bytes()
                    );
                    "(invalid)"
                });

            if let Some(stripped) = branch_name.strip_prefix("refs/remotes/") {
                if let Some((remote, name)) = stripped.split_once('/') {
                    remote_branches_map
                        .entry(remote.to_string())
                        .or_default()
                        .push(name.to_string());
                }
            }
        }

        Ok(remote_branches_map)
    }

    pub fn get_commit_changes(
        repo: &Repository,
        commit: &Commit,
    ) -> Result<Vec<FileChange>, git2::Error> {
        let commit_tree = commit.tree()?;
        let parent_commit = commit.parent(0).ok();
        let parent_tree = parent_commit
            .and_then(|c| c.tree().ok())
            .unwrap_or_else(|| {
                let tree_oid = repo.treebuilder(None).unwrap().write().unwrap();
                repo.find_tree(tree_oid).unwrap()
            });

        let mut diff_opts = DiffOptions::new();
        diff_opts.context_lines(3).show_binary(true);

        let diff =
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), Some(&mut diff_opts))?;

        let mut changes = Vec::new();

        diff.foreach(
            &mut |delta, _| {
                let old_path = delta
                    .old_file()
                    .path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_default();
                let new_path = delta
                    .new_file()
                    .path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_default();
                let change_type = format!("{:?}", delta.status());

                let file = if delta.status() == git2::Delta::Deleted {
                    old_path
                } else {
                    new_path
                };

                let patch = {
                    let blob = repo.find_blob(delta.new_file().id()).ok();
                    match blob {
                        Some(b) => String::from_utf8(b.content().to_vec()).unwrap_or_default(),
                        None => String::new(),
                    }
                };

                changes.push(FileChange {
                    file,
                    change_type,
                    patch,
                });

                true
            },
            None,
            None,
            None,
        )?;

        Ok(changes)
    }
}
