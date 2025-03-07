import React, { useState, useEffect } from 'react';
import styles from './MainLayout.module.css';
import ActionsSidebar from './ActionsSidebar/ActionsSidebar';
import CommitHistoryLOLAZO from './MainContainer/CommitHistory';
import InfoSidebar from './InfoSidebar/InfoSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GoDash } from "react-icons/go";
import { useAppContext } from '../../context/AppContext';

const MainLayout: React.FC = () => {
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const { commitInfo } = useAppContext();

  useEffect(() => {
    if (commitInfo)
      setShowInfoSidebar(true);
  }, [commitInfo]);

  return (
    <div className={styles.appMain}>
      <PanelGroup direction="horizontal">
        <Panel id="left-panel" order={1} minSize={20} defaultSize={31} maxSize={40}>
          <ActionsSidebar />
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle} />

        <Panel id="center-panel" order={2}>
          <CommitHistoryLOLAZO />
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
