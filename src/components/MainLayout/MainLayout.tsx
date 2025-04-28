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

interface MainLayoutProps {
  repoPath: string;
  isActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ repoPath, isActive }) => {
  const { currentAppTab, showInfoSidebar, setShowInfoSidebar, getRepoInfo } = useMainContext();

  const {
    leftSize,
    rightSize,
    setLeftSize,
    setRightSize
  } = usePanelSync();

  const panelLeftRef = useRef<any>(null);
  const panelRightRef = useRef<any>(null);
  const isProgrammaticResize = useRef(false);

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

  useEffect(() => {
    if (!/^Welcome Page:\d+$/.test(repoPath)) {
      getRepoInfo(repoPath);
    }
  }, [])

  const panelMaxSize = 40;

  return (
    <div className={`${styles.appMain} ${isActive ? '' : styles.inactive}`}>
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
