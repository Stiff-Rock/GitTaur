import React from 'react';
import { FileDirectorySymlinkIcon } from "@primer/octicons-react";
import styles from '../ActionBar.module.css';
import { useAppContext } from '../../../context/AppContext';
import { openPath } from '@tauri-apps/plugin-opener';

const OpenRepoDirButton: React.FC = () => {
  const { workspace, setNotification } = useAppContext();

  const openRepoDir = async () => {
    try {
      const path = workspace?.activeTab;

      if (!path) {
        setNotification("No active repository selected");
        return;
      }

      await openPath(path);
    } catch (error) {
      setNotification(`Failed to open directory: ${error instanceof Error ? error.message : error}`);
      console.error("Directory open error:", error);
    }
  };

  return (
    <button
      className={`${styles.actionButton} actionButton`}
      onClick={openRepoDir}
      title="Open repository in file explorer"
    >
      <FileDirectorySymlinkIcon />
    </button>
  );
};

export default OpenRepoDirButton;
