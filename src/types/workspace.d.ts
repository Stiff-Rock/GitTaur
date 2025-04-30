interface Tab {
  label: string;
  repoPath: string;
}

interface Workspace {
  tabs: Map<string, Tab>;
  activeTab: string;
}

interface WorkspaceDTO {
  tabs: [string, Tab][];
  activeTab: string;
}
