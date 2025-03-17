import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { RepoInfo, CommitInfo } from './../types/repoInfo';
import { invoke } from '@tauri-apps/api/core';
import { AppTabs } from './../types/appTabs';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  repoInfo: RepoInfo | null;
  commitInfo: CommitInfo | null;
  selectedCommit: string | null;
  showInfoSidebar: boolean;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitInfo | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;

  // Global Function
  getRepoInfo: (repoPath: string) => Promise<void>;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export const MainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<AppTabs>(AppTabs.CommitHistory);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string>('');
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  let lastInfoSidebarState = useRef(false);

  useEffect(() => {
    if (currentTab === AppTabs.LocalChanges || currentTab === AppTabs.TodoPanel) {
      setShowInfoSidebar(true);
    } else {
      setShowInfoSidebar(lastInfoSidebarState.current);
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === AppTabs.CommitHistory) {
      lastInfoSidebarState.current = showInfoSidebar;
    }

    if (!showInfoSidebar) {
      setSelectedCommit("");
      setCommitInfo(null);
    }
  }, [showInfoSidebar]);

  useEffect(() => {
    if (commitInfo) {
      setShowInfoSidebar(true);
    }
  }, [commitInfo]);

  const getRepoInfo = async (repoPath: string) => {
    const info = await invoke<RepoInfo>("get_repo_info", { path: repoPath });
    setRepoInfo(info);
  }

  return (
    <MainContext.Provider value={{
      currentAppTab: currentTab, setCurrentAppTab: setCurrentTab,
      repoInfo, setRepoInfo,
      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      showInfoSidebar, setShowInfoSidebar,
      getRepoInfo,
    }}>
      {children}
    </MainContext.Provider>
  );
}

export const useMainContext = (): MainContextType => {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error('useMainContext must be used within an MainProvider');
  }
  return context;
};
