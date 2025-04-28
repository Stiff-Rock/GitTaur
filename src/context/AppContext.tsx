import React, { createContext, useState, useContext, useEffect, useRef, useLayoutEffect } from 'react';
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
  openWorkspaceTab: (tabKey: string, newTab: Tab) => void;
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

  const pattern = /^Welcome Page:\d+$/;

  const isLoaded = useRef(false);

  // The backend information of the workspace gets loaded on startup
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const workspaceData: Workspace = await invoke('get_workspace');

        if (Object.entries(workspaceData.tabs).length === 0) {
          const defaultPage: string = "Welcome Page:" + Date.now();
          const newTab: Tab = { label: "Welcome Page", repoPath: defaultPage };

          const newWorkspace: Workspace = {
            ...workspaceData,
            tabs: { [defaultPage]: newTab },
            activeTab: defaultPage
          };

          setWorkspace(newWorkspace);
        } else {
          setWorkspace(workspaceData);
        }
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    };

    if (!isLoaded.current) {
      fetchWorkspace();
      isLoaded.current = true;
    }
  }, []);

  useLayoutEffect(() => {
    if (!workspace) return;

    setIsInWelcomePage(isWelcomePage(workspace.activeTab));

    if (Object.entries(workspace.tabs).length === 0) {
      openWelcomePage();
    }

    invoke<Workspace>("save_workspace", { workspace: workspace })
      .catch(error => console.error('Error while saving workspace:', error));
  }, [workspace]);

  const isWelcomePage = (text: string): boolean => {
    return pattern.test(text)
  }

  //TODO: SI ABRE UN REPO QUE ESTA ENN EL HISTORIAL, ABRELO DE AHI, ESTA FUNCION ESTA MAL
  const openNewRepo = async () => {
    const repoPath = await openDirectoryDialog();
    if (!repoPath || !workspace) return;

    if (Object.entries(workspace.tabs).some(([tabKey]) => tabKey === repoPath)) {
      setActiveTab(repoPath);
      return;
    }

    const msg = await invoke<string>("open_repository", { path: repoPath });
    setNotification(msg);

    const label = await invoke<string>("get_last_directory", { path: repoPath });
    const newTab: Tab = { label, repoPath }
    openWorkspaceTab(repoPath, newTab);
  }

  const cloneRepo = async (path: string, repoUrl: string): Promise<boolean> => {
    try {
      const msg: string = await invoke("clone_repository", { path, repoUrl });
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

    if (Object.entries(workspace.tabs).length === 1 && isWelcomePage(tabKey)) {
      return;
    }

    const remainingTabs = Object.fromEntries(
      Object.entries(workspace.tabs).filter(([key]) => key !== tabKey)
    );

    let newActiveTab = workspace.activeTab;

    if (tabKey === workspace.activeTab) {
      const remainingEntries = Object.entries(remainingTabs);
      newActiveTab = remainingEntries.length > 0
        ? remainingEntries[remainingEntries.length - 1][0]
        : "";
    }

    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tabs: remainingTabs,
        activeTab: newActiveTab
      };
    });
  };

  const openWorkspaceTab = (tabKey: string, newTab: Tab) => {
    if (!workspace) return;

    const currentTabs = Object.entries(workspace.tabs);
    currentTabs.push([tabKey, newTab]);

    let filteredTabs = currentTabs;

    const currentActiveTab = workspace.activeTab;
    if (!isWelcomePage(tabKey) && isWelcomePage(currentActiveTab)) {
      filteredTabs = currentTabs.filter(([key]) => key !== currentActiveTab);
    }

    const newTabs = Object.fromEntries(filteredTabs);

    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tabs: newTabs,
        activeTab: tabKey,
      };
    });
  };

  const setActiveTab = (tabId: string) => {
    setIsInWelcomePage(isWelcomePage(tabId));
    setWorkspace(prev => {
      if (!prev) return prev;
      return { ...prev, activeTab: tabId };
    });
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
      openWorkspaceTab,
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
