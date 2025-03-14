import React, { useEffect } from "react";
import styles from "./WindowTabs.module.css";
import { GoCodespaces, GoPlus } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";
import { invoke } from "@tauri-apps/api/core";

const WindowTabs: React.FC = () => {
  const { workspace, setActiveTab, activeTab, isWelcomePage, openWorkspaceTab, closeWorkspaceTab } = useAppContext();

  // Active Tab
  useEffect(() => {
    if (!workspace || !activeTab) return

    if (!Object.keys(workspace.tabs).includes(activeTab)) {
      const addTab = async () => {
        const repoPath = activeTab;
        let label: string;

        if (activeTab.includes("/") || activeTab.includes("\\"))
          label = await invoke<string>("get_last_directory", { path: activeTab })
        else label = activeTab;

        const newTab = {
          label,
          repoPath,
          isActive: true
        };

        openWorkspaceTab(activeTab, newTab);
      };

      addTab();
    }
  }, [activeTab])

  function openNewTab() {
    if (!workspace) return;

    const label = "Welcome Page";
    let repoPath = label;

    if (repoPath === "Welcome Page") {
      repoPath += ":" + Date.now();
    } else if (Object.keys(workspace.tabs).includes(repoPath)) {
      return;
    }

    const newTab = {
      label,
      repoPath,
      isActive: true
    };

    openWorkspaceTab(repoPath, newTab);
    setActiveTab(newTab.repoPath);
  }

  function closeTab(tabKey: string) {
    if (!workspace) return;

    const currentTabKeys = Object.keys(workspace.tabs);
    if (currentTabKeys.length === 1 && isWelcomePage(currentTabKeys[0]))
      return;

    const updatedTabs = closeWorkspaceTab(tabKey);

    if (tabKey === activeTab) {
      const remainingKeys = Object.keys(updatedTabs);
      if (remainingKeys.length > 0) {
        const prevTab = remainingKeys[remainingKeys.length - 1];
        setActiveTab(prevTab);
      } else {
        openNewTab();
      }
    }
  }

  return (
    <div className={`${styles.tabs}`}>
      <GoCodespaces title="Switch workspace" className={`${styles.workspaceIcon}`} />

      {workspace?.tabs && Object.keys(workspace.tabs).length > 0 ? (
        Object.entries(workspace.tabs).map(([key, tab]) => (
          <Tab
            key={tab.repoPath}
            label={tab.label}
            isActive={activeTab === key}
            onClick={() => setActiveTab(key)}
            onClose={() => closeTab(tab.repoPath)}
          />
        ))
      ) : (
        <span>ERROR</span>
      )}

      <GoPlus onClick={() => openNewTab()} className={`${styles.workspaceIcon}`} />
    </div>
  );
};

export default WindowTabs;
