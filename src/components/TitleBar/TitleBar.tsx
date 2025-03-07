import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from "./TitleBar.module.css";
import { GoX, GoDash, GoScreenFull, GoScreenNormal, GoCodespaces, GoPlus } from "react-icons/go";
import { invoke } from '@tauri-apps/api/core';
import type { RepoInfo } from '../../types/repoInfo';
import { useRepo } from '../../context/RepoContext';

const TitleBar: React.FC = () => {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);
  const { setRepoInfo } = useRepo();

  // Listens to window maximized state changes
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    const unlistenPromise = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    checkMaximized();

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [appWindow]);

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
    <div className={`${styles.titleBar}`}>
      <div className={`${styles.windowTabs}`}>
        <GoCodespaces className={`${styles.workspaceIcon}`} />
        <GoPlus onClick={() => openDefault()} className={`${styles.workspaceIcon}`} />
      </div>

      <div className={`${styles.windowControls}`}>
        <button className={`${styles.controlBtn} ${styles.minimize}`} onClick={() => appWindow.minimize()}>
          <GoDash />
        </button>
        <button className={`${styles.controlBtn}`} onClick={() => appWindow.toggleMaximize()}>
          {isMaximized ? <GoScreenNormal /> : <GoScreenFull />}
        </button>
        <button className={`${styles.controlBtn} ${styles.close}`} onClick={() => appWindow.close()}>
          <GoX />
        </button>
      </div>

    </div >
  );
};

export default TitleBar;
