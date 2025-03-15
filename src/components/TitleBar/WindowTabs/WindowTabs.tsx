import React from "react";
import styles from "./WindowTabs.module.css";
import { CodespacesIcon, PlusIcon } from "@primer/octicons-react";
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";

const WindowTabs: React.FC = () => {
  const { workspace, setActiveTab, closeWorkspaceTab, openWelcomePage } = useAppContext();

  return (
    <div className={`${styles.tabs}`}>
      <button
        className='actionButton'
        title="Switch workspace"
      >
        <CodespacesIcon className={`${styles.workspaceIcon}`} />
      </button>

      {
        workspace?.tabs && workspace.tabs.length > 0 ? (
          workspace.tabs.map(([key, tab]) => (
            <Tab
              key={key}
              label={tab.label}
              isActive={workspace.activeTab === key}
              onClick={() => setActiveTab(key)}
              onClose={() => closeWorkspaceTab(key)}
            />
          ))
        ) : (
          <span>ERROR</span>
        )
      }

      <button
        className='actionButton'
        title="Open new tab"
        onClick={openWelcomePage}
      >
        <PlusIcon className={`${styles.workspaceIcon}`} />
      </button>
    </div >
  );
};

export default WindowTabs;
