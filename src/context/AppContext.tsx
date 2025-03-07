import React, { createContext, useState, useContext } from 'react';
import type { RepoInfo } from './../types/repoInfo';
import type { CommitInfo } from './../types/repoInfo';

interface AppContextType {
  repoInfo: RepoInfo | null;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  commitInfo: CommitInfo | null;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitInfo | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);

  return (
    <AppContext.Provider value={{ repoInfo, setRepoInfo, commitInfo, setCommitInfo }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useRepo must be used within an AppProvider');
  }
  return context;
};

