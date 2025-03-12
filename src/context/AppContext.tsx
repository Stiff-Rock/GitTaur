import React, { createContext, useState, useContext, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { RepoInfo } from './../types/repoInfo';
import type { Workspace } from './../types/workspace';
import { useDialog } from '../hooks/useDialog';


interface AppContextType {
  // State 
  activeTab: string;
  workspace: Workspace | null;
  notification: string;

  // Setters 
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setNotification: React.Dispatch<React.SetStateAction<string>>;

  // Global Functions
  openNewRepo: () => Promise<void>;
  openRepo: (repoPath: string) => Promise<RepoInfo | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState("Welcome Page");

  const { openDirectoryDialog } = useDialog();
  const [notification, setNotification] = useState("");

  // The backend information of the workspace gets loaded on startup
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const workspaceData: Workspace = await invoke('get_workspace');
        if (!workspaceData.tabs || Object.keys(workspaceData.tabs).length === 0) {
          const defaultPage: string = "Welcome Page";
          workspaceData.tabs = {
            defaultPage: {
              label: defaultPage,
              repoPath: defaultPage,
            }
          };
          setActiveTab("Welcome Page")
        }
        setWorkspace(workspaceData);
        setActiveTab(workspaceData.activeTab);
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    };

    fetchWorkspace();
  }, []);

  useEffect(() => {
    if (!workspace || !activeTab) return;
    setWorkspace(prevWorkspace => ({
      ...prevWorkspace!,
      activeTab,
    }));
  }, [activeTab]);

  const openNewRepo = async () => {
    const repoPath = await openDirectoryDialog();
    if (!repoPath) return;
    await openRepo(repoPath);
  }

  const openRepo = async (repoPath: string): Promise<RepoInfo | null> => {
    try {
      let resolveRepoInfo: (info: RepoInfo) => void;
      const repoInfoPromise = new Promise<RepoInfo>((resolve) => {
        resolveRepoInfo = resolve;
      });

      const unlisten = await listen<RepoInfo>('repo-info', (event) => {
        unlisten();
        resolveRepoInfo(event.payload);
      });

      const msg = await invoke<string>("open_repository", { path: repoPath });
      setNotification(msg);

      const repoinfo = await repoInfoPromise;
      return repoinfo;
    } catch (error) {
      console.error("Error:", error);
      setNotification("Failed to open repository");
      return null;
    }
  };
  return (
    <AppContext.Provider value={{
      // States and Setters
      activeTab, setActiveTab,
      workspace, setWorkspace,
      notification, setNotification,
      // Global Functions
      openNewRepo,
      openRepo
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
