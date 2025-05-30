import React, { createContext, useState, useContext, useEffect, useRef, useLayoutEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { Base64 } from 'js-base64';
import { useAppContext } from './AppContext';
import { invoke } from '@tauri-apps/api/core';
import { FileItem } from '../components/MainLayout/MainContainer/LocalChanges/LocalChanges';

interface MainContextType {
  // State 
  currentAppTab: AppTabs;
  inChangesTab: boolean;

  repoPath: string;

  repoInfo: RepoInfo | null;
  commitHistory: Record<string, CommitLog> | null;
  repoStatus: RepoStatus | null;
  repoStashes: Stash[] | null;

  lastSelectedChange: { name: string, status: FileStatusState } | null;
  fileDiff: string;

  commitInfo: CommitLog | null;
  selectedCommit: string;
  showInfoSidebar: boolean;
  shouldScroll: boolean;

  isUnstagedLoading: boolean;
  isStagedLoading: boolean;
  isStashLoading: boolean;

  selectedFiles: FileItem[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;

  // Setters 
  setCurrentAppTab: React.Dispatch<React.SetStateAction<AppTabs>>;
  setInChangesTab: React.Dispatch<React.SetStateAction<boolean>>;

  setRepoInfo: React.Dispatch<React.SetStateAction<RepoInfo | null>>;
  setRepoStatus: React.Dispatch<React.SetStateAction<RepoStatus | null>>;
  setRepoStashes: React.Dispatch<React.SetStateAction<Stash[] | null>>;

  setLastSelectedChange: React.Dispatch<React.SetStateAction<{ name: string, status: FileStatusState } | null>>;
  setFileDiff: React.Dispatch<React.SetStateAction<string>>;

  setSelectedCommit: React.Dispatch<React.SetStateAction<string>>;
  setCommitHistory: React.Dispatch<React.SetStateAction<Record<string, CommitLog> | null>>;
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

  getRepoStatus: () => void;
  getStashedChanges: () => void;

  addToStagingArea: (files: string[]) => Promise<void>;
  removeFromStagingArea: (files: string[]) => Promise<void>;
  discardChanges: (files: string[]) => Promise<void>;
  stashChanges: (stashMsg: String) => Promise<void>;
  applyStash: (index: number) => Promise<void>;
  dropStash: (index: number) => Promise<void>;
  popStash: (index: number) => Promise<void>;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

interface MainProviderProps {
  children: React.ReactNode;
  repoPath: string;
}

export const MainProvider: React.FC<MainProviderProps> = (props) => {
  const { children, repoPath } = props;

  const { setNotification } = useAppContext();

  const repoId = Base64.encodeURI(repoPath);
  const headEvent = `git-head-updated-${repoId}`;
  const fetchEvent = `git-fetch-completed-${repoId}`;
  const statusEvent = `git-status-changed-${repoId}`;

  const [currentAppTab, setCurrentAppTab] = useState<AppTabs>("commit-history");
  const [inChangesTab, setInChangesTab] = useState(true);

  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commitHistory, setCommitHistory] = useState<Record<string, CommitLog> | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoStashes, setRepoStashes] = useState<Stash[] | null>(null);

  const [lastSelectedChange, setLastSelectedChange] = useState<{ name: string, status: FileStatusState } | null>(null);
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
    if (commitHistory && selectedCommit) {
      const commitLog = commitHistory[selectedCommit];
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

  // Changes section functions and states
  const [isUnstagedLoading, setIsUnstageLoading] = useState(false);
  const [isStagedLoading, setIsStageLoading] = useState(false);
  const [isStashLoading, setIsStashLoading] = useState(false);

  // This ref is used to ensure that no other operation that might change status executes while another is runnning
  const statusUpdatePromiseRef = useRef<Promise<any> | null>(null);

  const getRepoStatus = () => {
    statusUpdatePromiseRef.current = invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch(e => {
        console.error(e);
        setNotification(e);
      })
  };

  const getStashedChanges = () => {
    statusUpdatePromiseRef.current = invoke<Stash[]>("get_stashed_changes", { repoPath })
      .then(setRepoStashes)
      .catch(e => {
        console.error(e);
        setNotification(e);
      }).finally(() => setIsStashLoading(false));
  };

  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const addToStagingArea = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsStageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    statusUpdatePromiseRef.current = invoke("add_to_staging_area", { repoPath, files }).catch((e) => {
      const msg = `Error staging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(() => setIsStageLoading(false));
  };

  const removeFromStagingArea = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsUnstageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    statusUpdatePromiseRef.current = invoke("remove_from_staging_area", { repoPath, files }).catch((e) => {
      const msg = `Error unstaging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(() => setIsUnstageLoading(false));
  };

  const discardChanges = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsUnstageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    statusUpdatePromiseRef.current = invoke("discard_changes", { repoPath, files }).catch((e) => {
      console.error("Error discarding changes: ", e);
      setNotification("Error discarding changes: " + e);
    }).finally(() => setIsUnstageLoading(false));
  };

  const stashChanges = async (stashMsg: String) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }

    const files = selectedFiles.map(f => f.fileName);
    const fileStatus = files[0];

    let loadingIndicatorState: (isLoading: boolean) => void;
    if (fileStatus === "unstaged") {
      loadingIndicatorState = setIsUnstageLoading;
    } else {
      loadingIndicatorState = setIsStageLoading;
    }

    loadingIndicatorState(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    statusUpdatePromiseRef.current = invoke("stash_changes", { repoPath, stashMsg, files }).catch((e) => {
      console.error("Error stashing changes: ", e);
      setNotification("Error stashing changes: " + e);
    }).finally(() => loadingIndicatorState(false));
  };

  const applyStash = async (index: number) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }

    setIsStashLoading(true);

    statusUpdatePromiseRef.current = invoke("apply_stash", { repoPath, index }).catch((e) => {
      console.error("Error applying stash: ", e);
      setNotification("Error applying stash: " + e);
    }).finally(() => setIsStashLoading(false));
  };

  const dropStash = async (index: number) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }

    setIsStashLoading(true);

    statusUpdatePromiseRef.current = invoke("drop_stash", { repoPath, index }).catch((e) => {
      console.error("Error dropping stash: ", e);
      setNotification("Error dropping stash: " + e);
    }).finally(() => setIsStashLoading(false));
  };

  const popStash = async (index: number) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }

    setIsStashLoading(true);

    statusUpdatePromiseRef.current = invoke("pop_stash", { repoPath, index }).catch((e) => {
      console.error("Error popping stash: ", e);
      setNotification("Error popping stash: " + e);
    }).finally(() => setIsStashLoading(false));
  };

  return (
    <MainContext.Provider value={{
      repoPath,

      currentAppTab, setCurrentAppTab,
      inChangesTab, setInChangesTab,

      repoInfo, setRepoInfo,
      commitHistory, setCommitHistory,
      repoStatus, setRepoStatus,
      repoStashes, setRepoStashes,

      lastSelectedChange, setLastSelectedChange,
      fileDiff, setFileDiff,

      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      showInfoSidebar, setShowInfoSidebar,
      shouldScroll, setShouldScroll,

      isUnstagedLoading,
      isStagedLoading,
      isStashLoading,

      selectedFiles, setSelectedFiles,

      headEvent,
      fetchEvent,
      statusEvent,

      scrollbarRef,
      scrollToCommit,

      getRepoStatus,
      getStashedChanges,
      addToStagingArea,
      removeFromStagingArea,
      discardChanges,
      stashChanges,
      applyStash,
      dropStash,
      popStash
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
