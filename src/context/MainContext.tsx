import React, { createContext, useState, useContext, useEffect } from 'react';
import type { RepoInfo, CommitInfo } from './../types/repoInfo';
import { invoke } from '@tauri-apps/api/core';


interface MainContextType {
  // State 
  repoInfo: RepoInfo | null;
  commitInfo: CommitInfo | null;
  showInfoSidebar: boolean;

  // Setters 
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitInfo | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;

  // Global Function
  getRepoInfo: (repoPath: string) => Promise<void>;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export const MainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  useEffect(() => {
    if (commitInfo)
      setShowInfoSidebar(true);
  }, [commitInfo]);

  const getRepoInfo = async (repoPath: string) => {
    const info = await invoke<RepoInfo>("get_repo_info", { path: repoPath });
    setRepoInfo(info);
  }

  return (
    <MainContext.Provider value={{
      repoInfo, setRepoInfo,
      commitInfo, setCommitInfo,
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
