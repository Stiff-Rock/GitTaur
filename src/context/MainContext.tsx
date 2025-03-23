import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { RepoInfo, CommitInfo } from './../types/repoInfo';
import { invoke } from '@tauri-apps/api/core';
import { AppTabs } from './../types/appTabs';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  repoInfo: RepoInfo | null;
  commitInfo: CommitInfo | null;
  selectedCommit: string;
  showInfoSidebar: boolean;
  shouldScroll: boolean;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitInfo | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setShouldScroll: React.Dispatch<React.SetStateAction<boolean>>;

  // Refs
  scrollbarsRef: React.MutableRefObject<Scrollbars | null>;
  selectedCommitRef: React.MutableRefObject<HTMLSpanElement | null>;

  // Global Function
  getRepoInfo: (repoPath: string) => Promise<void>;
  scrollToCommit: () => void;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export const MainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<AppTabs>(AppTabs.CommitHistory);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitInfo | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string>("");
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  const scrollbarsRef = useRef<Scrollbars>(null);
  const selectedCommitRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

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

    if (shouldScroll) {
      scrollToCommit();
    }
  }, [commitInfo]);

  const getRepoInfo = async (repoPath: string) => {
    const info = await invoke<RepoInfo>("get_repo_info", { path: repoPath });
    setRepoInfo(info);
  }

  const scrollToCommit = () => {
    //TODO: THIS DOES NOT SCROLL CORRECTLY TO THE LOCATION
    if (!scrollbarsRef.current || !selectedCommitRef.current) return;

    const scrollbars = scrollbarsRef.current;
    const scrollContainer = scrollbars.getValues();
    const selectedElement = selectedCommitRef.current;

    if (!scrollContainer || !selectedElement) return;

    const elementTop = selectedElement.offsetTop;
    const containerHeight = scrollContainer.clientHeight;
    const elementHeight = selectedElement.clientHeight;

    const scrollToPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

    scrollbars.scrollTop(scrollToPosition);
    console.log("SCROLLED")
  };

  return (
    <MainContext.Provider value={{
      currentAppTab: currentTab, setCurrentAppTab: setCurrentTab,
      repoInfo, setRepoInfo,
      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      showInfoSidebar, setShowInfoSidebar,
      shouldScroll, setShouldScroll,
      getRepoInfo,
      scrollToCommit,
      scrollbarsRef,
      selectedCommitRef
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
