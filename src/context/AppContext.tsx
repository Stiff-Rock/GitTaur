import React, { createContext, useState, useContext, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useDialog } from '../hooks/useDialog';

interface AppContextType {
  // State 
  workspace: Workspace | null;

  isInWelcomePage: boolean
  isInConfigPage: boolean
  isInRepoPage: boolean

  activeModal: AppModals;
  notification: string;
  activeRepoInfo: RepoInfo | null;

  // Setters 
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;

  setIsInWelcomePage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInConfigPage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInRepoPage: React.Dispatch<React.SetStateAction<boolean>>;

  setActiveModal: React.Dispatch<React.SetStateAction<AppModals>>;
  setNotification: React.Dispatch<React.SetStateAction<string>>;
  setActiveRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;

  // Global Functions
  isWelcomePage: (text: string) => boolean;
  openNewRepo: (path: string) => void;
  setActiveTab: (tabId: string) => void;
  closeWorkspaceTab: (tabKey: string) => void;
  openWelcomePage: () => void;
  openConfigPage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DtoToWorkspace = (dto: WorkspaceDTO): Workspace => {
  return {
    tabs: new Map<string, Tab>(dto.tabs),
    activeTab: dto.activeTab
  };
}

const WorkspaceToDto = (workspace: Workspace): WorkspaceDTO => {
  return {
    tabs: [...workspace.tabs],
    activeTab: workspace.activeTab
  };
}

const isWelcomePage = (text: string): boolean => {
  return /^Welcome Page:\d+$/.test(text)
}

let initWorkspace: Workspace | null = null;
(() => {
  const workspace_dto = window.__WORKSPACE_DTO__;
  if (!workspace_dto) return;
  initWorkspace = DtoToWorkspace(workspace_dto);
})();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(initWorkspace);

  const [isInWelcomePage, setIsInWelcomePage] = useState(true);
  const [isInConfigPage, setIsInConfigPage] = useState(true);
  const [isInRepoPage, setIsInRepoPage] = useState(true);

  const [activeModal, setActiveModal] = useState<AppModals>("");
  const [notification, setNotification] = useState("");
  const [activeRepoInfo, setActiveRepoInfo] = useState<RepoInfo | null>(null);

  const { openDirectoryDialog } = useDialog();

  //TODO: REVISE IF THIS REALLY NEEDS TO BE useLayoutEffect
  useEffect(() => {
    // If theres already a workspace loaded, do not make api call
    if (initWorkspace) return;
    invoke<WorkspaceDTO>("get_workspace")
      .then((dto) => setWorkspace(DtoToWorkspace(dto)))
      .catch((e) => console.error("Could not get workspace - {}", e));
  }, []);

  const updatePageStates = (tabKey: string) => {
    let inConfigPage = false;
    let inWelcomePage = false;
    let inRepoPage = false;

    if (tabKey === "ConfigPage") {
      inConfigPage = true;
    } else if (isWelcomePage(tabKey)) {
      inWelcomePage = true;
    } else {
      inRepoPage = true;
    }

    setIsInConfigPage(inConfigPage);
    setIsInWelcomePage(inWelcomePage);
    setIsInRepoPage(inRepoPage);
  }

  useEffect(() => {
    if (!workspace) return;
    console.log("WOKRPACE:", workspace);

    updatePageStates(workspace.activeTab);

    if (workspace.activeTab === "ConfigPage") return;

    if (workspace.tabs.size <= 0) {
      openWelcomePage();
    } else if (workspace.activeTab === "" || !workspace.tabs.has(workspace.activeTab)) {
      console.warn(`Found not valid active tab ${workspace.activeTab}. Attempting fallback...`)
      const fallbackTab = [...workspace.tabs][workspace.tabs.size - 1][0]
      setActiveTab(fallbackTab);
    }

    const workspaceDto = WorkspaceToDto(workspace);

    invoke<Workspace>("save_workspace", { workspaceDto })
      .catch(error => console.error('Error while saving workspace:', error));
  }, [workspace]);

  const setActiveTab = (tabKey: string) => {
    updatePageStates(tabKey);
    setWorkspace(prev => {
      if (!prev) return prev;
      return { ...prev, activeTab: tabKey };
    });
  };

  //TODO: SI ABRE UN REPO QUE ESTA EN EL HISTORIAL, ABRELO DE AHI, DEBERIA ESTAR CACHEADO
  const openNewRepo = async (path: string = "") => {
    if (!workspace) return;

    const repoPath = path || await openDirectoryDialog();
    if (!repoPath) return;

    // If already present in worksapce, just show that tab (early return)
    if (workspace.tabs.has(repoPath)) {
      setActiveTab(repoPath);
      return;
    }

    try {
      const result = await invoke<string>("open_repo", { repoPath });
      setNotification(result);
    } catch (e) {
      const error = e as string;
      setNotification(error);
      if (!error.includes("not a repository")) {
        console.error(e);
      }
      return;
    }

    const split = repoPath.replace(/\\/g, '/').split("/");
    const label = split[split.length - 1];
    const newTab: Tab = { label, repoPath }
    openWorkspaceTab(repoPath, newTab);
  }

  const closeWorkspaceTab = (tabKey: string) => {
    if (!workspace) return;

    const tabs = new Map<string, Tab>(workspace.tabs);

    // If it is the only tab and it's a welcome page, don't close it
    const tabIsWelcomePage = isWelcomePage(tabKey);
    if (tabs.size === 1 && tabIsWelcomePage) return;

    if (!tabIsWelcomePage)
      invoke("stop_git_watcher", { repoPath: tabKey }).catch((e) => {
        const msg = `Error stopping status watcher - ${e}`;
        console.error(msg);
        setNotification(msg);
      });

    // Gets the position that tab was in before removing it
    const removedTabIndex = [...tabs.keys()].indexOf(tabKey);
    if (removedTabIndex === -1) {
      const msg = "Error: Could not find tab on workspace (returned -1): " + tabKey
      console.error(msg)
      return;
    }

    // Removes the closed tab from the workspace
    tabs.delete(tabKey);

    // Checks whether there is any other tab opened and activates that instead, if not, goes to welcome page
    let activeTab = workspace.activeTab;
    if (tabKey === activeTab) {
      if (tabs.size > 0) {
        if (removedTabIndex < tabs.size) {
          activeTab = [...tabs.keys()][removedTabIndex];
        }
        else {
          activeTab = [...tabs.keys()][removedTabIndex - 1];
        }
      } else {
        console.warn("No active tab could be assined while closing " + tabKey + ":", tabs)
        activeTab = "";
      }
    }

    const newWorkspace: Workspace = { tabs, activeTab }

    setWorkspace(newWorkspace);
  };

  const openWorkspaceTab = (newTabKey: string, newTab: Tab) => {
    if (!workspace) return;

    // Gets the workspace tabs
    let tabs = new Map<string, Tab>(workspace.tabs);

    // Adds the new tab. If it is a welcome page, just push it, otherwise replace the welcome tab with the new one
    const entries = [...workspace.tabs.entries()];
    if (isWelcomePage(newTabKey) || newTabKey === "ConfigPage") {
      entries.push([newTabKey, newTab]);
    } else {
      const index = [...workspace.tabs.keys()].indexOf(workspace.activeTab);
      entries.splice(index, 1, [newTabKey, newTab]);
    }

    tabs = new Map(entries);

    setWorkspace({ activeTab: newTabKey, tabs });
  };

  const openWelcomePage = () => {
    if (!workspace) return;

    const label = "Welcome Page";
    const repoPath = label + ":" + Date.now();;
    const key = repoPath;

    const newTab = {
      label,
      repoPath,
    };

    openWorkspaceTab(key, newTab);
  }

  const openConfigPage = () => {
    if (!workspace) return;
    const key = "ConfigPage";
    openWorkspaceTab(key, {
      label: "Configuration",
      repoPath: key,
    });
  }

  return (
    <AppContext.Provider value={{
      // States and Setters
      workspace, setWorkspace,

      isInWelcomePage, setIsInWelcomePage,
      isInConfigPage, setIsInConfigPage,
      isInRepoPage, setIsInRepoPage,

      activeModal, setActiveModal,
      notification, setNotification,
      activeRepoInfo, setActiveRepoInfo,

      // Global Functions
      isWelcomePage,
      openNewRepo,
      closeWorkspaceTab,
      setActiveTab,
      openWelcomePage,
      openConfigPage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
