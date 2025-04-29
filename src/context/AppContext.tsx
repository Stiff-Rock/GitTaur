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
  const isWelcomePage = (text: string): boolean => {
    return pattern.test(text)
  }

  //TODO: DELETE FOR RELEASE, PREVENTS DOUBLE LOADING
  const isLoaded = useRef(false);

  // The backend information of the workspace gets loaded on startup
  useEffect(() => {
    //TODO: MAYBE THIS HAS TO BE ASYNC OR USE useLayoutEffect
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

    invoke<Workspace>("save_workspace", { workspace })
      .catch(error => console.error('Error while saving workspace:', error));
  }, [workspace]);

  //TODO: SI ABRE UN REPO QUE ESTA EN EL HISTORIAL, ABRELO DE AHI, ESTA FUNCION ESTA MAL
  const openNewRepo = async () => {
    if (!workspace) return;

    const repoPath = await openDirectoryDialog();
    if (!repoPath) return;

    // If already present in worksapce, just show that tab (early return)
    if (Object.entries(workspace.tabs).some(([tabKey]) => tabKey === repoPath)) {
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

    const tabs = Object.entries(workspace.tabs);

    // If the only tab is a welcome page, don't close it
    if (tabs.length === 1 && isWelcomePage(tabKey)) return;

    // Gets the position that tab was in before removing it
    const removedTabIndex = tabs.findIndex(([key]) => key === tabKey);
    if (removedTabIndex === -1) {
      const msg = "Error: Could not find tab on workspace (returned -1): " + tabKey
      console.error(msg)
      return;
    }

    // Removes the closed tab from the workspace
    const remainingTabs = tabs.filter(([key]) => key !== tabKey)

    // Checks whether there is any other tab opened and activates that instead, if not, goes to welcome page
    let newActiveTab = workspace.activeTab;
    if (tabKey === workspace.activeTab) {
      if (remainingTabs.length > 0) {
        if (removedTabIndex < remainingTabs.length) {
          newActiveTab = remainingTabs[removedTabIndex][0];
        }
        else {
          newActiveTab = remainingTabs[remainingTabs.length - 1][0];
        }
      } else {
        newActiveTab = "";
      }
    }

    const newTabs = Object.fromEntries(remainingTabs);
    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tabs: newTabs,
        activeTab: newActiveTab
      };
    });
  };

  const openWorkspaceTab = (newTabKey: string, newTab: Tab) => {
    if (!workspace) return;

    // Gets the workspace tabs, and repalces the welcome page tab position with the new tab
    const tabs = Object.entries(workspace.tabs);
    console.log("OLDTABS:", tabs)
    //const wpIndex = tabs.findIndex(([key]) => key === newTabKey);
    //if (wpIndex !== -1) {
    //BUG: IT NEVER FINDS THE WELCOME PAGE
    //tabs.splice(wpIndex, 1, [newTabKey, newTab])
    //} else {
    tabs.push([newTabKey, newTab]);
    //}
    console.log("NEWTABS:", tabs)
    //console.log("WPINDEX:", wpIndex, "TAB:", newTabKey)

    // Updates the workspace with the new content
    const newTabs = Object.fromEntries(tabs); //BUG: IS IN EHRE THAT THE ORDER GETS FUCKED UP
    console.log("ENTRIES:", newTabs)
    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tabs: newTabs,
        activeTab: newTabKey,
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
