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

interface Commit {
  id: string;
  parents: string[];
  children: string[];
  author: UserInfo;
  date: number;
  subject: string;
  body: string;
  refs: string[];
  changes: FileChanges[]
  isFromMainBranch: boolean;
}

interface Remote {
  name: string,
  url: string,
  branches: string[]
}

interface RepoInfo {
  name: string;
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
