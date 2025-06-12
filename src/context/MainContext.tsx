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
  repoHistory: RepoHistory | null;
  repoStatus: RepoStatus | null;
  repoStashes: Stash[] | null;

  lastSelectedChange: { name: string, status: FileStatusState } | null;
  fileDiff: string;

  commitInfo: Commit | null;
  selectedCommit: string;
  showInfoSidebar: boolean;

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
  setRepoHistory: React.Dispatch<React.SetStateAction<RepoHistory | null>>;
  setCommitInfo: React.Dispatch<React.SetStateAction<Commit | null>>;
  setShowInfoSidebar: React.Dispatch<React.SetStateAction<boolean>>;

  // Tauri events
  headEvent: string;
  fetchEvent: string;
  statusEvent: string;

  // Refs
  scrollbarRef: React.MutableRefObject<Scrollbars | null>;

  // Global Functions
  scrollToCommit: (commitId: string) => void;

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
  const [repoHistory, setRepoHistory] = useState<RepoHistory | null>(null);

  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [repoStashes, setRepoStashes] = useState<Stash[] | null>(null);

  const [lastSelectedChange, setLastSelectedChange] = useState<{ name: string, status: FileStatusState } | null>(null);
  const [fileDiff, setFileDiff] = useState<string>("");

  const [commitInfo, setCommitInfo] = useState<Commit | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string>("");

  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  const scrollbarRef = useRef<Scrollbars>(null);

  let lastInfoSidebarState = useRef(false);

  useLayoutEffect(() => {
    if (currentAppTab === "local-changes") {
      setShowInfoSidebar(true);
    } else if (currentAppTab === "todo-panel") {
      setShowInfoSidebar(false);
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
    if (repoHistory && selectedCommit) {
      const commitObj = repoHistory.commitHistoryMap.get(selectedCommit);
      if (commitObj) setCommitInfo(commitObj);
    }
  }, [selectedCommit]);

  useEffect(() => {
    if (commitInfo && !showInfoSidebar) setShowInfoSidebar(true);
  }, [commitInfo]);

  const scrollToCommit = (commitId: string) => {
    if (!scrollbarRef.current) return;
    const scrollbar = scrollbarRef.current;
    const element = document.getElementById(commitId);
    if (!element) return;
    // Get container height
    const containerHeight = scrollbar.getClientHeight();
    // For SVG elements, use getBoundingClientRect() instead of offsetTop/offsetHeight
    const rect = element.getBoundingClientRect();
    // Get the scrollbar container's position
    const scrollbarRect = scrollbar.container.getBoundingClientRect();
    // Calculate element's position relative to the scrollbar container
    const elementRelativeTop = rect.top - scrollbarRect.top + scrollbar.getScrollTop();
    const elementHeight = rect.height;
    // Calculate scroll position to center the element
    const scrollTop = elementRelativeTop - (containerHeight / 2) + (elementHeight / 2);
    // Scroll to the calculated position
    scrollbar.scrollTop(scrollTop);
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
      repoHistory, setRepoHistory,
      repoStatus, setRepoStatus,
      repoStashes, setRepoStashes,

      lastSelectedChange, setLastSelectedChange,
      fileDiff, setFileDiff,

      commitInfo, setCommitInfo,
      selectedCommit, setSelectedCommit,
      showInfoSidebar, setShowInfoSidebar,

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
