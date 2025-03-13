import React, { createContext, useState, useContext, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Workspace } from './../types/workspace';
import { useDialog } from '../hooks/useDialog';
import type { Tab } from './../types/tab';

interface AppContextType {
  // State 
  activeTab: string;
  workspace: Workspace | null;
  isInWelcomePage: boolean
  notification: string;

  // Setters 
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setIsInWelcomePage: React.Dispatch<React.SetStateAction<boolean>>;
  setNotification: React.Dispatch<React.SetStateAction<string>>;

  // Global Functions
  openNewRepo: () => Promise<void>;
  isWelcomePage: (text: string) => boolean;

  openWorkspaceTab: (tabKey: string, newTab: Tab) => { [key: string]: Tab };
  closeWorkspaceTab: (tab: string) => { [key: string]: Tab };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState("Welcome Page:" + Date.now());
  const [isInWelcomePage, setIsInWelcomePage] = useState(true);

  const { openDirectoryDialog } = useDialog();
  const [notification, setNotification] = useState("");

  // The backend information of the workspace gets loaded on startup
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const workspaceData: Workspace = await invoke('get_workspace');
        if (!workspaceData.tabs || Object.keys(workspaceData.tabs).length === 0) {
          const defaultPage: string = "Welcome Page:" + Date.now();
          workspaceData.tabs = {
            defaultPage: {
              label: defaultPage,
              repoPath: defaultPage,
            }
          };
          setActiveTab(defaultPage)
        } else {
          setWorkspace(workspaceData);
          setActiveTab(workspaceData.activeTab);
        }
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    };

    fetchWorkspace();
  }, []);

  useEffect(() => {
    if (!workspace || !activeTab) return;

    const inWelcomePage = isWelcomePage(activeTab)
    if (isInWelcomePage !== inWelcomePage) {
      setIsInWelcomePage(inWelcomePage);
    }

    setWorkspace(prevWorkspace => ({
      ...prevWorkspace!,
      activeTab,
    }));
  }, [activeTab]);

  useEffect(() => {
    if (!workspace) return;
    invoke<Workspace>("save_workspace", { workspace: workspace })
      .catch(error => console.error('Error while saving workspace:', error));
  }, [workspace]);

  const pattern = /^Welcome Page:\d+$/;
  const isWelcomePage = (text: string): boolean => {
    return pattern.test(text)
  }

  const openNewRepo = async () => {
    const repoPath = await openDirectoryDialog();
    if (!repoPath) return;

    const msg = await invoke<string>("open_repository", { path: repoPath });
    setNotification(msg);

    console.log("ACTIVE TAB BEFORE: " + activeTab)
    closeWorkspaceTab(activeTab);

    const label = await invoke<string>("get_last_directory", { path: repoPath });
    const newTab: Tab = { label, repoPath }
    openWorkspaceTab(repoPath, newTab);
    setActiveTab(repoPath);
  }

  const openWorkspaceTab = (tabKey: string, newTab: Tab): { [key: string]: Tab } => {
    const updatedTabs = { ...workspace!.tabs };
    updatedTabs[tabKey] = newTab;

    setWorkspace(prev => ({
      ...prev!,
      tabs: updatedTabs,
    }));

    return updatedTabs;
  }

  const closeWorkspaceTab = (tab: string): { [key: string]: Tab } => {
    const updatedTabs = { ...workspace!.tabs };
    delete updatedTabs[tab];

    setWorkspace(prev => ({
      ...prev!,
      tabs: updatedTabs,
    }));

    return updatedTabs;
  }

  return (
    <AppContext.Provider value={{
      // States and Setters
      workspace, setWorkspace,
      activeTab, setActiveTab,
      isInWelcomePage, setIsInWelcomePage,
      notification, setNotification,
      // Global Functions
      openNewRepo,
      isWelcomePage,
      openWorkspaceTab,
      closeWorkspaceTab,
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
