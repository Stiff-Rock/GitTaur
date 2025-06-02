export const dtoToWorkspace = (dto: WorkspaceDTO): Workspace => {
  return {
    tabs: new Map<string, Tab>(dto.tabs),
    activeTab: dto.activeTab,
    recentRepos: dto.recentRepos
  };
}

export const workspaceToDto = (workspace: Workspace): WorkspaceDTO => {
  return {
    tabs: [...workspace.tabs],
    activeTab: workspace.activeTab,
    recentRepos: workspace.recentRepos
  };
}
