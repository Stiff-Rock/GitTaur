import React, { useEffect, useRef } from 'react';
import styles from './MainLayout.module.css';
import ActionsSidebar from './ActionsSidebar/ActionsSidebar';
import CommitHistory from './MainContainer/CommitHistory';
import InfoSidebar from './InfoSidebar/InfoSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GoDash } from "react-icons/go";
import { useMainContext } from '../../context/MainContext';
import { usePanelSync } from '../../context/PanelSyncContext';

interface MainLayoutProps {
  repoPath: string;
  isActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ repoPath, isActive }) => {
  const { showInfoSidebar, setShowInfoSidebar, getRepoInfo } = useMainContext();

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

  return (
    <div className={`${styles.appMain} ${isActive ? '' : styles.inactive}`}>
      <PanelGroup direction="horizontal">
        <Panel
          ref={panelLeftRef}
          id="left-panel"
          order={1}
          minSize={20}
          defaultSize={leftSize}
          maxSize={40}
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
          <CommitHistory />
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
              maxSize={40}
              onResize={(size) => {
                if (!isProgrammaticResize.current) {
                  setRightSize(size);
                }
              }}
            >
              <GoDash className={styles.closeButton} onClick={() => setShowInfoSidebar(false)} />
              <InfoSidebar />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default MainLayout;
