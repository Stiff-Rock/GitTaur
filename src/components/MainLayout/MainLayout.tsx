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
import TodoPanelInfoSidebar from './InfoSidebar/TodoPanel/TodoPanelInfoSidebar';
import CommitGraph from './MainContainer/CommitHistory/CommitGraph';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../context/AppContext';
import FetchRemoteModal from '../Common/Modals/FetchRemote/FetchRemoteModal';
import PullRemoteModal from '../Common/Modals/PullRemote/PullRemoteModal';
import PushRemoteModal from '../Common/Modals/PushRemote/PushRemoteModal';
import { listen } from '@tauri-apps/api/event';

interface MainLayoutProps {
  isActive: boolean;
}

interface RepoEvents {
  headEvent: string,
  fetchEvent: string,
  statusEvent: string,
}

const MainLayout: React.FC<MainLayoutProps> = ({ isActive }) => {
  const {
    repoPath,
    currentAppTab,
    showInfoSidebar,
    setShowInfoSidebar,
    setRepoInfo, repoInfo,
    headEvent, fetchEvent, statusEvent
  } = useMainContext();

  const {
    setNotification,
    activeModal,
    setActiveRepoInfo,
    isWelcomePage,
    workspace
  } = useAppContext();

  const {
    leftSize,
    rightSize,
    setLeftSize,
    setRightSize
  } = usePanelSync();

  const panelLeftRef = useRef<any>(null);
  const panelRightRef = useRef<any>(null);
  const isProgrammaticResize = useRef(false);

  const getRepoInfo = () => {
    console.log("PRE")
    if (!workspace || isWelcomePage(workspace.activeTab)) return;
    console.log("GETTING REPO INFO")
    invoke<RepoInfo>("get_repo_info", { repoPath })
      .then((data) => setRepoInfo(data))
      .catch((e) => { if (e) { console.error(e); setNotification("Error: " + e); } });
  }

  // Fetch repo data on load and initilize repo watchers
  //TODO: DELETE REF ON RELEASE
  const isLoaded = useRef(false);
  useEffect(() => {
    if (isLoaded.current || repoInfo || !isActive) return;

    console.log("SETTING UP");
    const repoEvents: RepoEvents = { headEvent, fetchEvent, statusEvent };
    invoke("setup_watchers", { repoPath, repoEvents })
      .catch(e => console.error("Error starting git watcher:", e));

    const headUnlistenPromise = listen<string>(headEvent, getRepoInfo);
    const fetchUnlistenPromise = listen<string>(fetchEvent, getRepoInfo);

    getRepoInfo();

    isLoaded.current = true;

    return () => {
      headUnlistenPromise.then(unlisten => unlisten());
      fetchUnlistenPromise.then(unlisten => unlisten());
    };
  }, [])

  useEffect(() => {
    if (isActive) setActiveRepoInfo(repoInfo);
  }, [repoInfo]);

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
          <CommitGraph />
          <LocalChanges />
          <TodoPanel />
        </Panel>

        {showInfoSidebar && (
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

              <TodoPanelInfoSidebar />

            </Panel>
          </>
        )}
      </PanelGroup>

      {activeModal === "fetch" && <FetchRemoteModal />}
      {activeModal === "pull" && <PullRemoteModal />}
      {activeModal === "push" && <PushRemoteModal />}
    </div>
  );
};

export default MainLayout;
