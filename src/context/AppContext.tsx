import React, { createContext, useState, useContext, useRef, useLayoutEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useDialog } from '../hooks/useDialog';

interface AppContextType {
  // State 
  workspace: Workspace | null;
  isInWelcomePage: boolean
  cloneRepoModalActive: boolean;
  notification: string;

  // Setters 
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  setIsInWelcomePage: React.Dispatch<React.SetStateAction<boolean>>;
  setCloneRepoModalActive: React.Dispatch<React.SetStateAction<boolean>>;
  setNotification: React.Dispatch<React.SetStateAction<string>>;

  // Global Functions
  isWelcomePage: (text: string) => boolean;
  openNewRepo: () => void;
  cloneRepo: (path: string, repoUrl: string) => Promise<boolean>;
  setActiveTab: (tabId: string) => void;
  closeWorkspaceTab: (tabKey: string) => void;
  openWelcomePage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { openDirectoryDialog } = useDialog();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isInWelcomePage, setIsInWelcomePage] = useState(true);
  const [cloneRepoModalActive, setCloneRepoModalActive] = useState(false);
  const [notification, setNotification] = useState("");

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

  // The backend information of the workspace gets loaded on startup
  const loadWorkspace = (workspace_dto: WorkspaceDTO) => {
    const workspace = DtoToWorkspace(workspace_dto);
    if (workspace.tabs.size === 0) {
      const pageLabel = "Welcome Page";
      const defaultPage: string = pageLabel + ":" + Date.now();
      const newTab: Tab = { label: pageLabel, repoPath: defaultPage };

      const newTabs = new Map<string, Tab>(workspace.tabs);
      newTabs.set(defaultPage, newTab);

      const newWorkspace: Workspace = {
        tabs: newTabs,
        activeTab: defaultPage
      };

      setWorkspace(newWorkspace);
    } else {
      setWorkspace(workspace);
    }
  }

  const fetchWorkspace = () => {
    try {
      let workspace_dto = window.__WORKSPACE_DTO__;

      if (!workspace_dto) {
        invoke("get_workspace")
          .then((dto) => {
            if (dto) loadWorkspace(dto as WorkspaceDTO)
            else throw "Unable to load workspace"
          });
      } else {
        loadWorkspace(workspace_dto)
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  }

  //TODO: DELETE FOR RELEASE, PREVENTS DOUBLE LOADING
  const isLoaded = useRef(false);
  if (!isLoaded.current) {
    fetchWorkspace();
    isLoaded.current = true;
  }

  const setActiveTab = (tabKey: string) => {
    setIsInWelcomePage(isWelcomePage(tabKey));
    setWorkspace(prev => {
      if (!prev) return prev;
      return { ...prev, activeTab: tabKey };
    });
  };

  const isWelcomePage = (text: string): boolean => {
    return /^Welcome Page:\d+$/.test(text)
  }

  useLayoutEffect(() => {
    if (!workspace) return;

    if (workspace.tabs.size <= 0) {
      openWelcomePage();
    } else if (workspace.activeTab == "" || !workspace.tabs.has(workspace.activeTab)) {
      console.warn(`Found not valid active tab ${workspace.activeTab}. Attempting fallback...`)
      const fallbackTab = [...workspace.tabs][workspace.tabs.size - 1][0]
      setActiveTab(fallbackTab);
    }

    setIsInWelcomePage(isWelcomePage(workspace.activeTab));

    const workspaceDto = WorkspaceToDto(workspace);

    invoke<Workspace>("save_workspace", { workspaceDto })
      .catch(error => console.error('Error while saving workspace:', error));
  }, [workspace]);

  //TODO: SI ABRE UN REPO QUE ESTA EN EL HISTORIAL, ABRELO DE AHI, DEBERIA ESTAR CACHEADO
  const openNewRepo = async () => {
    if (!workspace) return;

    const repoPath = await openDirectoryDialog();
    if (!repoPath) return;

    // If already present in worksapce, just show that tab (early return)
    if (workspace.tabs.has(repoPath)) {
      setActiveTab(repoPath);
      return;
    }

    //TODO: ESTO POR AHORA NO HACE NADA, MIRAR WORKSPACE EN RUST
    const msg = await invoke<string>("open_repo", { repoPath });
    setNotification(msg);

    const split = repoPath.replace(/\\/g, '/').split("/");
    const label = split[split.length - 1];
    const newTab: Tab = { label, repoPath }
    openWorkspaceTab(repoPath, newTab);
  }

  const cloneRepo = async (path: string, repoUrl: string): Promise<boolean> => {
    try {
      const msg: string = await invoke("clone_repo", { path, repoUrl });
      if (msg)
        console.error(msg);
      setNotification(msg);
    } catch (error) {
      console.error('Error clonando repositorio:', error)
    }
    return true;
  };

  const closeWorkspaceTab = (tabKey: string) => {
    if (!workspace) return;

    const tabs = new Map<string, Tab>(workspace.tabs);

    // If the only tab is a welcome page, don't close it
    if (tabs.size === 1 && isWelcomePage(tabKey)) return;

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
    if (isWelcomePage(newTabKey)) {
      entries.push([newTabKey, newTab]);
    } else {
      const index = [...workspace.tabs.keys()].indexOf(workspace.activeTab);
      entries.splice(index, 1, [newTabKey, newTab]);
    }

    tabs = new Map(entries);

    setWorkspace({ activeTab: newTabKey, tabs });
  };

  //BUG: WHEN OPENING THE SAME
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

  return (
    <AppContext.Provider value={{
      // States and Setters
      workspace, setWorkspace,
      isInWelcomePage, setIsInWelcomePage,
      cloneRepoModalActive, setCloneRepoModalActive,
      notification, setNotification,
      // Global Functions
      isWelcomePage,
      openNewRepo,
      cloneRepo,
      closeWorkspaceTab,
      setActiveTab,
      openWelcomePage,
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
