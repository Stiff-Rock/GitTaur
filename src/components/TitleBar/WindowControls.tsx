import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import "../../assets/styles/variables.css";
import styles from "./TitleBar.module.css";
import { GoX, GoDash, GoScreenFull, GoScreenNormal } from "react-icons/go";

const WindowControls: React.FC = () => {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

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

  return (
    <div className={styles.windowControls}>
      <button className={`${styles.controlBtn} ${styles.minimize}`} onClick={() => appWindow.minimize()}>
        <GoDash />
      </button>
      <button className={`${styles.controlBtn}`} onClick={() => appWindow.toggleMaximize()}>
        {isMaximized ? <GoScreenNormal /> : <GoScreenFull />}
      </button>
      <button className={`${styles.controlBtn} ${styles.close}`} onClick={() => appWindow.close()}>
        <GoX />
      </button>
    </div >
  );
};

export default WindowControls;
