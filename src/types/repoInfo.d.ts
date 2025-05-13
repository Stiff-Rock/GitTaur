interface UserInfo {
  name: string;
  email: string;
  timestamp: number;
}

interface RepoStatus {
  unstagedFiles: FileChanges[];
  stagedFiles: FileChanges[];
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
  mainBranch: string;
  currentBranch: string;
  localBranches: string[];
  remotes: Record<string, string[]>;
  tags: string[];
  commitHistory: Record<string, CommitLog>;
}
