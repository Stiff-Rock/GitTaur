/// <reference path="./types/appTabs.d.ts" />
/// <reference path="./types/fileChange.d.ts" />
/// <reference path="./types/repoInfo.d.ts" />
/// <reference path="./types/workspace.d.ts" />

declare global {
  interface Window {
    __WORKSPACE_DTO__?: WorkspaceDTO;
  }
}

export { };
