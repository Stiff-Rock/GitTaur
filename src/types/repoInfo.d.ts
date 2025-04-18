interface FileChange {
  file: string;
  change_type: string;
  patch: string;
}

interface CommitNode {
  sha: string;
  branch: string;
  refs: string[];
  subject: string;
  body: string;
  author: string;
  email: string;
  commit_date: string;
  parents: string[];
}

interface RepoInfo {
  name: string;
  main_branch: string;
  current_branch: string;
  local_branches: string[];
  remotes: Record<string, string[]>;
  tags: string[];
  commit_history: Record<string, CommitNode>;
}
