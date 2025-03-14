import React from "react";
import styles from "./WindowTabs.module.css";
import { GoCodespaces, GoPlus } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";

const WindowTabs: React.FC = () => {
  const { workspace, setActiveTab, closeWorkspaceTab, openWelcomePage } = useAppContext();

  return (
    <div className={`${styles.tabs}`}>
      <GoCodespaces title="Switch workspace" className={`${styles.workspaceIcon}`} />

      {workspace?.tabs && workspace.tabs.length > 0 ? (
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
      )}

      <GoPlus onClick={openWelcomePage} className={`${styles.workspaceIcon}`} />
    </div>
  );
};

export default WindowTabs;
