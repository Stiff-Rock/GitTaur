export interface FileChange {
  file: string;
  change_type: string;
  patch: string;
}

export interface CommitInfo {
  sha: string;
  subject: string;
  body: string;
  author: string;
  email: string;
  commit_date: string;
  parents: string[];
}

export interface RepoInfo {
  name: string;
  current_branch: string;
  local_branches: string[];
  remotes: string[];
  tags: string[];
  commits: { [key: string]: CommitInfo };
}
