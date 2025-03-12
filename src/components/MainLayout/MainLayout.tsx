import React, { useEffect, useRef } from 'react';
import styles from './MainLayout.module.css';
import ActionsSidebar from './ActionsSidebar/ActionsSidebar';
import CommitHistory from './MainContainer/CommitHistory';
import InfoSidebar from './InfoSidebar/InfoSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GoDash } from "react-icons/go";
import { useMainContext } from '../../context/MainContext';

interface MainLayoutProps {
  repoPath: string;
  isActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ repoPath, isActive }) => {
  const { showInfoSidebar, setShowInfoSidebar, getRepoInfo } = useMainContext();

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      getRepoInfo(repoPath);
      hasLoaded.current = true;
    }
  }, [])

  return (
    <div className={`${styles.appMain} ${isActive ? '' : styles.inactive}`}>
      <PanelGroup direction="horizontal">
        <Panel id="left-panel" order={1} minSize={20} defaultSize={31} maxSize={40}>
          <ActionsSidebar />
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle} />

        <Panel id="center-panel" order={2}>
          <CommitHistory />
        </Panel>

        {showInfoSidebar && (
          <>
            <PanelResizeHandle className={styles.resizeHandle} />
            <Panel id="right-panel" order={3} className={styles.rightPanel} minSize={30} maxSize={40}>
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
