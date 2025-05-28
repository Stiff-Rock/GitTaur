import React, { createContext, useState, useContext, useEffect, useRef, useLayoutEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { Base64 } from 'js-base64';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  inChangesTab: boolean;

  repoPath: string;

  repoInfo: RepoInfo | null;
  repoStatus: RepoStatus | null;
  repoStashes: Stash[] | null;

  selectedChange: { name: string, status: FileStatusState } | null;
  fileDiff: string;

  commitInfo: CommitLog | null;
  selectedCommit: string;
  showInfoSidebar: boolean;
  shouldScroll: boolean;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setInChangesTab: React.Dispatch<React.SetStateAction<boolean>>

  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setRepoStatus: React.Dispatch<React.SetStateAction<RepoStatus | null>>;
  setRepoStashes: React.Dispatch<React.SetStateAction<Stash[] | null>>;

  setSelectedChange: React.Dispatch<React.SetStateAction<{ name: string, status: FileStatusState } | null>>;
  setFileDiff: React.Dispatch<React.SetStateAction<string>>;

  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<CommitLog | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setShouldScroll: React.Dispatch<React.SetStateAction<boolean>>;

  // Tauri events
  headEvent: string;
  fetchEvent: string;
  statusEvent: string;

  // Refs
  scrollbarRef: React.MutableRefObject<Scrollbars | null>;

  // Global Functions
  scrollToCommit: () => void;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

interface MainProviderProps {
  children: React.ReactNode;
  repoPath: string;
}

export const MainProvider: React.FC<MainProviderProps> = (props) => {
  const { children, repoPath } = props;

  const repoId = Base64.encodeURI(repoPath);
  const headEvent = `git-head-updated-${repoId}`;
  const fetchEvent = `git-fetch-completed-${repoId}`;
  const statusEvent = `git-status-changed-${repoId}`;

  const [currentAppTab, setCurrentAppTab] = useState<AppTabs>("commit-history");
  const [inChangesTab, setInChangesTab] = useState(true);

  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoStashes, setRepoStashes] = useState<Stash[] | null>(null);

  const [selectedChange, setSelectedChange] = useState<{ name: string, status: FileStatusState } | null>(null);
  const [fileDiff, setFileDiff] = useState<string>("");

  const [commitInfo, setCommitInfo] = useState<CommitLog | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string>("");

  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  const scrollbarRef = useRef<Scrollbars>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  let lastInfoSidebarState = useRef(false);

  useLayoutEffect(() => {
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
    if (repoInfo && selectedCommit) {
      const commitLog = repoInfo.commitHistory[selectedCommit];
      setCommitInfo(commitLog);
    }
  }, [selectedCommit]);

  useEffect(() => {
    if (commitInfo) {
      setShowInfoSidebar(true);
    }

    if (shouldScroll) {
      scrollToCommit();
    }
  }, [commitInfo]);

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
      repoPath,

      currentAppTab, setCurrentAppTab,
      inChangesTab, setInChangesTab,

      repoInfo, setRepoInfo,
      repoStatus, setRepoStatus,
      repoStashes, setRepoStashes,

      selectedChange, setSelectedChange,
      fileDiff, setFileDiff,

      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      showInfoSidebar, setShowInfoSidebar,
      shouldScroll, setShouldScroll,

      headEvent,
      fetchEvent,
      statusEvent,

      scrollbarRef,
      scrollToCommit,
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
