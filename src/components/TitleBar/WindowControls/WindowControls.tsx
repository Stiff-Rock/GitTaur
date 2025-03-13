import React, { useState, useEffect } from 'react';
import { GoX, GoDash, GoScreenFull, GoScreenNormal } from "react-icons/go";
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from './WindowControls.module.css';

const WindowControls: React.FC = () => {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

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

  return (
    <div className={styles.windowControls}>

      <hr className={styles.sepparator} />
      <div className={styles.draggable} />

      <button className={`${styles.controlBtn} ${styles.minimize}`} onClick={() => appWindow.minimize()}>
        <GoDash />
      </button>
      <button className={styles.controlBtn} onClick={() => appWindow.toggleMaximize()}>
        {isMaximized ? <GoScreenNormal /> : <GoScreenFull />}
      </button>
      <button className={`${styles.controlBtn} ${styles.close}`} onClick={() => appWindow.close()}>
        <GoX />
      </button>
    </div>
  );
};

export default WindowControls;
