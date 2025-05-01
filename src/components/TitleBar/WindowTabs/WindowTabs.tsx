import React from "react";
import styles from "./WindowTabs.module.css";
import barStyles from '../TitleBar.module.css';
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";
import NewTabButton from "./NewTabButton";
import WorkspaceButton from "../TitleBarOptions/WorkspaceButton";
import SettingsButton from "../TitleBarOptions/SettingsButton";

const WindowTabs: React.FC = () => {
  const { workspace, setActiveTab, closeWorkspaceTab } = useAppContext();

  return (
    <div className={`${barStyles.windowTabs} ${styles.tabs}`}>
      <SettingsButton />
      <WorkspaceButton />

      {workspace?.tabs && [...workspace.tabs.entries()].map(([key, tab]) => (
        <Tab
          key={key}
          label={tab.label}
          isActive={workspace.activeTab === key}
          onClick={() => setActiveTab(key)}
          onClose={() => closeWorkspaceTab(key)}
        />
      ))}

      <NewTabButton />
    </div>
  );
};

export default WindowTabs;
