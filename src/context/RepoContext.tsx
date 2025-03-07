import React, { createContext, useState, useContext } from 'react';
import type { RepoInfo } from './../types/repoInfo';

interface RepoContextType {
  repoInfo: RepoInfo | null;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export const RepoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  return (
    <RepoContext.Provider value={{ repoInfo, setRepoInfo }}>
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = (): RepoContextType => {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
};
