import React, { useState, useLayoutEffect } from 'react';
import {
  XIcon,
  DashIcon,
  ScreenNormalIcon,
  ScreenFullIcon,
} from "@primer/octicons-react";
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from './WindowControls.module.css';

const WindowControls: React.FC = () => {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  // Listens to window maximized state changes
  useLayoutEffect(() => {
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

  const handleMinimize = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    appWindow.minimize()
  }

  const handleToggleMaximize = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    appWindow.toggleMaximize()
  }

  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    appWindow.close()
  }

  return (
    <div className={styles.windowControls}>

      <hr className={styles.sepparator} />
      <div className={styles.draggable} />

      <div className={styles.windowActions}>
        <button className={`${styles.controlBtn} ${styles.minimize}`} onClick={handleMinimize}>
          <DashIcon />
        </button>
        <button className={styles.controlBtn} onClick={handleToggleMaximize}>
          {isMaximized ? <ScreenNormalIcon /> : <ScreenFullIcon />}
        </button>
        <button className={`${styles.controlBtn} ${styles.close}`} onClick={handleClose}>
          <XIcon />
        </button>
      </div>
    </div>
  );
};

export default WindowControls;
