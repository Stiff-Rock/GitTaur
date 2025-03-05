import React from 'react';
import styles from './MainLayout.module.css';
import ActionsSidebar from './ActionsSidebar/ActionsSidebar';
import CommitHistory from './MainContainer/CommitHistory';
import InfoSidebar from './InfoSidebar/InfoSidebar';
import { Panel, PanelGroup, PanelResizeHandle, } from "react-resizable-panels";

const MainLayout: React.FC = () => {

  return (
    <div className={`${styles.appMain}`}>
      <PanelGroup direction='horizontal'>
        <Panel minSize={20} maxSize={40}>
          <ActionsSidebar />
        </Panel>

        <PanelResizeHandle className={`${styles.resizeHandle}`} />

        <Panel>
          <CommitHistory />
        </Panel>

        <PanelResizeHandle className={`${styles.resizeHandle}`} />

        <Panel minSize={20} maxSize={40} >
          <InfoSidebar />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default MainLayout;
