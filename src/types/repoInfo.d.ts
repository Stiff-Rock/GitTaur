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

type FileStatusState = "unstaged" | "staged";

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

interface Remote {
  name: string,
  url: string,
  branches: string[]
}

interface RepoInfo {
  name: string;
  mainBranch: string;
  currentBranch: string;
  localBranches: string[];
  remotes: Record<string, Remote>;
  tags: string[];
}

interface Stash {
  id: string,
  index: number,
  name: string,
  timestamp: number,
  contents: FileChanges[],
}
