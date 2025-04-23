interface UserInfo {
  name: string;
  email: string;
  timestamp: number;
}

interface FileStats {
  additions: number | null;
  deletions: number | null;
  file: string;
}

interface CommitLog {
  refs: string[];
  hash: string,
  hashAbbrev: string,
  tree: string,
  treeAbbrev: string,
  parents: string[],
  parentsAbbrev: string[],
  author: UserInfo;
  commiter: UserInfo
  subject: string;
  body: string;
  notes: string;
  stats: FileStats;
}

interface RepoInfo {
  name: string;
  main_branch: string;
  current_branch: string;
  local_branches: string[];
  remotes: Record<string, string[]>;
  tags: string[];
  commit_history: Record<string, CommitLog>;
}
