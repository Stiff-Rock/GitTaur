import React from 'react';
import { FileDirectorySymlinkIcon } from "@primer/octicons-react";
import styles from '../../ActionBar.module.css';
import { useAppContext } from '../../../../context/AppContext';
import { openPath } from '@tauri-apps/plugin-opener';

const OpenRepoDirButton: React.FC = () => {
  const { workspace, setNotification } = useAppContext();

  const openRepoDir = async () => {
    if (!workspace) return;

    try {
      const path = workspace.activeTab;
      await openPath(path);
    } catch (error) {
      setNotification(error as string);
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
