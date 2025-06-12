import React, { useEffect, useRef } from 'react';
import styles from './MainLayout.module.css';
import ActionsSidebar from './ActionsSidebar/ActionsSidebar';
import CommitInfoSidebar from './InfoSidebar/CommitInfoSidebar/CommitInfoSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { DashIcon } from "@primer/octicons-react";
import { useMainContext } from '../../context/MainContext';
import { usePanelSync } from '../../context/PanelSyncContext';
import LocalChanges from './MainContainer/LocalChanges/LocalChanges';
import TodoPanel from './MainContainer/TodoPanel/TodoPanel';
import LocalChangesInfoSidebar from './InfoSidebar/LocalChanges/LocalChangesInfoSidebar';
import CommitGraph from './MainContainer/CommitHistory/CommitGraph';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../context/AppContext';
import FetchRemoteModal from '../Common/Modals/FetchRemote/FetchRemoteModal';
import PullRemoteModal from '../Common/Modals/PullRemote/PullRemoteModal';
import PushRemoteModal from '../Common/Modals/PushRemote/PushRemoteModal';
import { listen } from '@tauri-apps/api/event';
import CreateBranchModal from '../Common/Modals/CreateBranch/CreateBranchModal';
import StashChangesModal from '../Common/Modals/StashChanges/StashChangesModal';
import AddRemoteModal from '../Common/Modals/AddRemoteModal/AddRemoteModal';
import RenameBranchModal from '../Common/Modals/RenameBranchModal/RenameBranchModal';
import TagBranchModal from '../Common/Modals/CreateTagModal/CreateTagModal';
import MergeBranchModal from '../Common/Modals/MergeBranchModal/MergeBranchModal';
import RebaseBranchModal from '../Common/Modals/RebaseBranchModal/RebaseBranchModal';

interface RepoEvents {
  headEvent: string,
  fetchEvent: string,
  statusEvent: string,
}

const MainLayout: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const {
    repoPath,
    currentAppTab,
    showInfoSidebar,
    setShowInfoSidebar,
    setRepoInfo, repoInfo,
    setRepoHistory: setCommitHistoryMap,
    headEvent, fetchEvent, statusEvent
  } = useMainContext();

  const {
    setNotification,
    activeModal,
    setActiveRepoInfo,
    workspace,
  } = useAppContext();

  const {
    leftSize,
    rightSize,
    setLeftSize,
    setRightSize,
  } = usePanelSync();

  const panelLeftRef = useRef<any>(null);
  const panelRightRef = useRef<any>(null);
  const isProgrammaticResize = useRef(false);

  const getRepoInfo = async () => {
    if (!workspace) return;
    invoke<RepoInfo>("get_repo_info", { repoPath })
      .then(setRepoInfo)
      .catch((e) => { if (e) { console.error(e); setNotification("Error: " + e); } });
  }

  const getCommitHistory = async () => {
    if (!workspace) return;
    invoke<string>("get_commit_history", { repoPath })
      .then((json) => {
        const historyJsonDTO = JSON.parse(json);
        const commitHistoryDto: Record<string, Commit> = historyJsonDTO.commitHistoryMap;
        const commitHistoryMap = new Map<string, Commit>();
        Object.entries(commitHistoryDto).forEach(([key, value]) => {
          commitHistoryMap.set(key, value);
        });
        const repoHistory: RepoHistory = {
          commitHistoryMap,
          headIsDetached: historyJsonDTO.headIsDetached,
          currentCommitId: historyJsonDTO.currentCommitId,
        };
        setCommitHistoryMap(repoHistory);
      })
      .catch((e) => { if (e) { console.error(e); setNotification("Error: " + e); } });
  }

  // Fetch repo data on load and initilize repository watchers
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (repoInfo) return;

    const shouldSetupWatchers =
      !import.meta.env.DEV ||
      (import.meta.env.DEV && !hasLoaded.current);

    const getRepoInfoAndHistory = () => {
      getRepoInfo();
      getCommitHistory();
    };

    if (shouldSetupWatchers) {
      if (import.meta.env.DEV) {
        hasLoaded.current = true;
      }

      const repoEvents: RepoEvents = { headEvent, fetchEvent, statusEvent };
      invoke("setup_watchers", { repoPath, repoEvents })
        .catch(e => console.error("Error starting git watcher:", e));

      getRepoInfoAndHistory();
    }

    // Set up listeners for watcher events
    const headUnlistenPromise = listen<string>(headEvent, getRepoInfoAndHistory);
    const fetchUnlistenPromise = listen<string>(fetchEvent, getRepoInfoAndHistory);
    const statusUnlistenPromise = listen<string>(statusEvent, getRepoInfo);

    return () => {
      headUnlistenPromise.then(unlisten => unlisten());
      fetchUnlistenPromise.then(unlisten => unlisten());
      statusUnlistenPromise.then(unlisten => unlisten());
    };
  }, []);


  useEffect(() => {
    if (isActive) setActiveRepoInfo(repoInfo);
  }, [isActive, repoInfo]);

  // Panel resizing synchronization
  useEffect(() => {
    if (!panelLeftRef.current) return;

    isProgrammaticResize.current = true;
    panelLeftRef.current.resize(leftSize);
    setTimeout(() => {
      isProgrammaticResize.current = false;
    }, 0);
  }, [leftSize]);

  useEffect(() => {
    if (!showInfoSidebar || !panelRightRef.current) return;

    isProgrammaticResize.current = true;
    panelRightRef.current.resize(rightSize);
    setTimeout(() => {
      isProgrammaticResize.current = false;
    }, 0);
  }, [rightSize, showInfoSidebar]);

  const panelMaxSize = 40;
  //TODO: WHEN OPENING AND CLOSING RIGHT the tab icons move a bit
  return (
    <div className={`${styles.appMain} ${isActive ? '' : 'inactive'}`}>
      <PanelGroup direction="horizontal">
        <Panel
          ref={panelLeftRef}
          id="left-panel"
          order={1}
          minSize={20}
          defaultSize={leftSize}
          maxSize={panelMaxSize}
          onResize={(size) => {
            if (!isProgrammaticResize.current) {
              setLeftSize(size);
            }
          }}
        >
          <ActionsSidebar />
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle} disabled={!isActive} />

        <Panel id="center-panel" order={2}>
          <CommitGraph isActive={isActive} />
          <LocalChanges />
          <TodoPanel isAcitve={isActive} />
        </Panel>

        {showInfoSidebar ? (
          <>
            <PanelResizeHandle className={styles.resizeHandle} disabled={!isActive} />
            <Panel
              ref={panelRightRef}
              id="right-panel"
              order={3}
              className={styles.rightPanel}
              minSize={30}
              defaultSize={rightSize}
              maxSize={panelMaxSize}
              onResize={(size) => {
                if (!isProgrammaticResize.current) {
                  setRightSize(size);
                }
              }}
            >

              <button
                onClick={() => setShowInfoSidebar(false)}
                className={`actionButton ${currentAppTab !== "commit-history" ? 'inactive' : ''}`}
              >
                <DashIcon className={styles.closeButton} />
              </button>

              <CommitInfoSidebar />
              <LocalChangesInfoSidebar />
            </Panel>
          </>
        ) : (
          // We add this div so the elements dont get shifted 1px when the right panel is unloaded
          <div style={{ minWidth: '1px', maxWidth: '1px' }} />
        )}
      </PanelGroup>

      {activeModal === "fetch" && <FetchRemoteModal />}
      {activeModal === "pull" && <PullRemoteModal />}
      {activeModal === "push" && <PushRemoteModal />}
      {activeModal === "branch" && <CreateBranchModal />}
      {activeModal === "stash" && <StashChangesModal />}
      {activeModal === "addRemote" && <AddRemoteModal />}
      {activeModal === "renameBranch" && <RenameBranchModal />}
      {activeModal === "createTag" && <TagBranchModal />}
      {activeModal === "merge" && <MergeBranchModal />}
      {activeModal === "rebase" && <RebaseBranchModal />}
    </div>
  );
};

export default MainLayout;
