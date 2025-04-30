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

interface MainLayoutProps {
  repoPath: string;
  isActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = (props) => {
  const { repoPath, isActive } = props;
  const { currentAppTab, showInfoSidebar, setShowInfoSidebar, setRepoInfo, repoInfo } = useMainContext();
  const { setNotification } = useAppContext();

  const {
    leftSize,
    rightSize,
    setLeftSize,
    setRightSize
  } = usePanelSync();

  const panelLeftRef = useRef<any>(null);
  const panelRightRef = useRef<any>(null);
  const isProgrammaticResize = useRef(false);

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

  // Fetch repo data on load
  //TODO: DELETE REF ON RELEASE
  const isLoaded = useRef(false);
  useEffect(() => {
    if (isLoaded.current || repoInfo) return;

    if (!/^Welcome Page:\d+$/.test(repoPath)) {
      invoke<RepoInfo>("get_repo_info", { repoPath })
        .then((data) => setRepoInfo(data))
        .catch((e) => { if (e) { console.error(e); setNotification("Error: " + e); } });
    }

    isLoaded.current = true;
  }, [])

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

        <PanelResizeHandle className={styles.resizeHandle} />

        <Panel id="center-panel" order={2}>
          {currentAppTab === "commit-history" && <CommitGraph />}
          {currentAppTab === "local-changes" && <LocalChanges />}
          {currentAppTab === "todo-panel" && <TodoPanel />}
        </Panel>

        {showInfoSidebar && (
          <>
            <PanelResizeHandle className={styles.resizeHandle} />
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
                className='actionButton'
              >
                <DashIcon className={styles.closeButton} />
              </button>
              {currentAppTab === "commit-history" && <CommitInfoSidebar />}
              {currentAppTab === "local-changes" && <LocalChangesInfoSidebar />}
              {currentAppTab === "todo-panel" && <TodoPanelInfoSidebar />}
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default MainLayout;
