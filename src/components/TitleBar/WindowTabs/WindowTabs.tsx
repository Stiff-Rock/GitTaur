import React, { useState } from "react";
import styles from "./WindowTabs.module.css";
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { RepoInfo } from '../../../types/repoInfo';
import { GoCodespaces, GoPlus } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';

const WindowTabs: React.FC = () => {
  const { setRepoInfo } = useAppContext();
  const [activeTab, setActiveTab] = useState("Tab1");

  async function openDefault() {
    const unlisten = await listen<RepoInfo>('repo-info', (event) => {
      setRepoInfo(event.payload);
      unlisten();
    });

    const path = "C:\\Users\\Yago\\Desktop\\PlateaApp";
    const msg: string = await invoke("open_repository", { path });
    console.log(msg);
  }

  return (
    <div className={`${styles.tabs}`}>


      <GoCodespaces className={`${styles.workspaceIcon}`} />

      <div onClick={() => setActiveTab("Tab1")} className={`${styles.tab} ${activeTab === 'Tab1' && styles.active}`}>
        <span>PlateaApp</span>
      </div>

      <div onClick={() => setActiveTab("Tab2")} className={`${styles.tab} ${activeTab === 'Tab2' && styles.active}`}>
        <span>PythonShit</span>
      </div>

      <GoPlus onClick={() => openDefault()} className={`${styles.workspaceIcon}`} />

    </div>
  );
};

export default WindowTabs;
