import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Scrollbars } from 'react-custom-scrollbars-2';
import type { Commit } from "@gitgraph/core";
import { ReactSvgElement } from '@gitgraph/react/lib/types';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  repoInfo: RepoInfo | null;
  commitInfo: CommitNode | null;
  selectedCommit: string;
  selectedCommitNode: Commit<ReactSvgElement> | null;
  showInfoSidebar: boolean;
  shouldScroll: boolean;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitNode | null>>;
  setSelectedCommitNode: React.Dispatch<React.SetStateAction<Commit<ReactSvgElement> | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setShouldScroll: React.Dispatch<React.SetStateAction<boolean>>;

  // Refs
  scrollbarsRef: React.MutableRefObject<Scrollbars | null>;

  // Global Function
  getRepoInfo: (repoPath: string) => Promise<void>;
  scrollToCommit: () => void;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export const MainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAppTab, setCurrentAppTab] = useState<AppTabs>("commit-history");
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitInfo, setCommitInfo] = useState<CommitNode | null>(null);
  const [selectedCommitNode, setSelectedCommitNode] = useState<Commit<ReactSvgElement> | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string>("");
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  const scrollbarsRef = useRef<Scrollbars>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  let lastInfoSidebarState = useRef(false);

  useEffect(() => {
    if (currentAppTab === "local-changes" || currentAppTab === "todo-panel") {
      setShowInfoSidebar(true);
    } else {
      setShowInfoSidebar(lastInfoSidebarState.current);
    }
  }, [currentAppTab]);

  useEffect(() => {
    if (currentAppTab === "commit-history") {
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
    if (!scrollbarsRef.current || !selectedCommitNode) return;

    const scrollbars = scrollbarsRef.current;
    const scrollContainer = scrollbars.getValues();
    const selectedElement = selectedCommitNode;

    if (!scrollContainer || !selectedElement) return;

    //TODO: SCROLL TO COMMIT

    /*const elementTop = selectedElement.offsetTop;
    const containerHeight = scrollContainer.clientHeight;
    const elementHeight = selectedElement.clientHeight;

    const scrollToPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

    scrollbars.scrollTop(scrollToPosition);
    console.log("SCROLLED")*/
  };

  return (
    <MainContext.Provider value={{
      currentAppTab, setCurrentAppTab,
      repoInfo, setRepoInfo,
      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      selectedCommitNode, setSelectedCommitNode,
      showInfoSidebar, setShowInfoSidebar,
      shouldScroll, setShouldScroll,
      getRepoInfo,
      scrollToCommit,
      scrollbarsRef,
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
