export interface CommitInfo {
  sha: string;
  subject: string;
  body: string;
  author: string;
  commit_date: string;
}

export interface RepoInfo {
  name: string;
  current_branch: string;
  local_branches: string[];
  remotes: string[];
  tags: string[];
  commits: CommitInfo[];
}
