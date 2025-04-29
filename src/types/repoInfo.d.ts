interface UserInfo {
  name: string;
  email: string;
  timestamp: number;
}

type ChangeType = "deleted" | "modified" | "added";

interface FileChanges {
  changeType: ChangeType;
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
  committer: UserInfo
  subject: string;
  body: string;
  notes: string;
  changes: FileChanges[];
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
