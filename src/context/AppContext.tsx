import React, { createContext, useState, useContext, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { RepoInfo, CommitInfo } from './../types/repoInfo';
import type { Workspace } from './../types/workspace';
import { useDialog } from '../hooks/useDialog';


interface AppContextType {
  // State 
  repoInfo: RepoInfo | null;
  commitInfo: CommitInfo | null;
  activeTab: string;
  workspace: Workspace | null;
  notification: string;

  // Setters 
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitInfo | null>>;
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setNotification: React.Dispatch<React.SetStateAction<string>>;

  // Global Functions
  openRepo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);

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

  const openRepo = async () => {
    const repoPath = await openDirectoryDialog();

    if (!repoPath) return;

    const unlisten = await listen<RepoInfo>('repo-info', (event) => {
      setRepoInfo(event.payload);
      setActiveTab(repoPath);
      unlisten();
    });

    const msg: string = await invoke("open_repository", { path: repoPath });
    setNotification(msg);
  }

  return (
    <AppContext.Provider value={{
      // States and Setters
      repoInfo, setRepoInfo,
      commitInfo, setCommitInfo,
      activeTab, setActiveTab,
      workspace, setWorkspace,
      notification, setNotification,
      // Global Functions
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
