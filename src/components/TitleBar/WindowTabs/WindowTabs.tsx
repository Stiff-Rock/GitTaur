import React, { useEffect } from "react";
import styles from "./WindowTabs.module.css";
import { GoCodespaces, GoPlus } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';
import Tab from "./Tab";
import { invoke } from "@tauri-apps/api/core";
import { Workspace } from "../../../types/workspace";

const WindowTabs: React.FC = () => {
  const { workspace, setWorkspace, setActiveTab, activeTab } = useAppContext();

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

        setWorkspace(prev => ({
          ...prev!,
          tabs: {
            ...prev!.tabs,
            [activeTab]: newTab
          }
        }));
      };

      addTab();
    }
  }, [activeTab])

  function openTab(label: string = "Welcome Page", repoPath: string = "Welcome Page") {
    if (!workspace) return;

    if (Object.keys(workspace.tabs).includes(repoPath)) {
      if (repoPath !== "Welcome Page")
        console.warn("This repository is already opened")
      return;
    }

    const newTab = {
      label,
      repoPath,
      isActive: true
    };

    setWorkspace(prev => ({
      ...prev!,
      tabs: {
        ...prev!.tabs,
        [repoPath]: newTab
      }
    }));
    setActiveTab(newTab.repoPath);
  }

  function closeTab() {
    if (!workspace) return;

    const currentTabKeys = Object.keys(workspace.tabs);
    if (currentTabKeys.length === 1 && currentTabKeys[0] === "Welcome Page")
      return;

    const updatedTabs = { ...workspace.tabs };
    delete updatedTabs[activeTab];

    setWorkspace(prev => ({
      ...prev!,
      tabs: updatedTabs,
    }));

    const remainingKeys = Object.keys(updatedTabs);
    if (remainingKeys.length > 0) {
      const prevTab = remainingKeys[remainingKeys.length - 1];
      console.warn(prevTab);
      setActiveTab(prevTab);
    } else
      openTab();
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

      <GoPlus onClick={() => openTab()} className={`${styles.workspaceIcon}`} />
    </div>
  );
};

export default WindowTabs;
