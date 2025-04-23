import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Scrollbars } from 'react-custom-scrollbars-2';
import type { Commit } from "@gitgraph/core";
import { ReactSvgElement } from '@gitgraph/react/lib/types';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  repoInfo: RepoInfo | null;
  commitInfo: CommitLog | null;
  selectedCommit: string;
  selectedCommitNode: Commit<ReactSvgElement> | null;
  showInfoSidebar: boolean;
  shouldScroll: boolean;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitLog | null>>;
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
  const [commitInfo, setCommitInfo] = useState<CommitLog | null>(null);
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
    /*BUG: IT ALWAYS SCROLLS TO 320, ALMOST THERE
    if (!scrollbarsRef.current || !selectedCommitNode) return;

    const scrollbars = scrollbarsRef.current;
    const elementContainer = document.getElementById(`commit-${selectedCommitNode.hash}`);

    if (!elementContainer) return;

    // Get the scroll container DOM element
    const scrollContainerElement = scrollbars.container;
    const containerRect = scrollContainerElement.getBoundingClientRect();
    const elementRect = elementContainer.getBoundingClientRect();

    // Calculate element's top relative to the scroll container's viewport
    const elementTopRelativeToContainer = elementRect.top - containerRect.top;

    // Current scroll position of the container
    const currentScrollTop = scrollbars.getScrollTop();

    // Calculate the element's position within the scrollable content
    const elementPositionInContent = currentScrollTop + elementTopRelativeToContainer;

    // Get container and element heights
    const containerHeight = containerRect.height;
    const elementHeight = elementRect.height;

    // Calculate target scroll position to center the element
    console.log("elementPositionInContent: " + elementPositionInContent)
    console.log("containerHeight: " + containerHeight)
    console.log("elementHeight: " + elementHeight)
    const targetScrollTop = elementPositionInContent - (containerHeight / 2) + (elementHeight / 2);

    // Perform the scroll
    scrollbars.scrollTop(targetScrollTop);*/
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
