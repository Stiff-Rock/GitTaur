import React, { useEffect } from "react";
import styles from "./WindowTabs.module.css";
import { GoCodespaces, GoPlus } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";
import { invoke } from "@tauri-apps/api/core";

const WindowTabs: React.FC = () => {
  const { workspace, setActiveTab, activeTab, isWelcomePage, openWorkspaceTab, closeWorkspaceTab } = useAppContext();

  // Active Tab TODO: MAYBE DELETE THIS SINCE THE WAY OF ADDING THE NEW TABS IS ADDING IT TO ACTIVE TAB AND WE DONT WANT THAT
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
    const label = "Welcome Page";
    let repoPath = label;

    if (!workspace) return;

    if (Object.keys(workspace.tabs).includes(repoPath) && !isWelcomePage(repoPath)) {
      console.warn("This repository is already opened")
      return;
    }

    if (repoPath === "Welcome Page") repoPath += ":" + Date.now();

    const newTab = {
      label,
      repoPath,
      isActive: true
    };

    openWorkspaceTab(repoPath, newTab);
    setActiveTab(newTab.repoPath);
  }

  function closeTab() {
    if (!workspace) return;

    const currentTabKeys = Object.keys(workspace.tabs);
    if (currentTabKeys.length === 1 && isWelcomePage(currentTabKeys[0]))
      return;

    const updatedTabs = closeWorkspaceTab(activeTab);

    const remainingKeys = Object.keys(updatedTabs);
    if (remainingKeys.length > 0) {
      const prevTab = remainingKeys[remainingKeys.length - 1];
      setActiveTab(prevTab);
    } else {
      openNewTab();
    }
  }

  return (
    <div className={`${styles.tabs}`}>
      <GoCodespaces className={`${styles.workspaceIcon}`} />

      {workspace?.tabs && Object.keys(workspace.tabs).length > 0 ? (
        Object.entries(workspace.tabs).map(([key, tab]) => (
          <Tab
            key={tab.repoPath}
            label={tab.label}
            isActive={activeTab === key}
            onClick={() => setActiveTab(key)}
            onClose={() => closeTab()}
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
