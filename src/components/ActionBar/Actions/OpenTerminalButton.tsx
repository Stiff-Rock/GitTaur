import React from 'react';
import { TerminalIcon } from "@primer/octicons-react";
import styles from '../ActionBar.module.css';
import { useAppContext } from '../../../context/AppContext';
import { invoke } from '@tauri-apps/api/core';

const OpenTerminalDirButton: React.FC = () => {
  const { setNotification, workspace } = useAppContext();

  const openTerminal = async () => {
    if (!workspace) return;
    const path = workspace.activeTab;
    try {
      await invoke('open_terminal', { path })
        .then(() => console.log('Terminal opened'))
        .catch((error) => console.error('Error opening terminal:', error));
    } catch (error) {
      setNotification("Failed to open terminal: " + error);
    }
  };

  return (
    <button
      className={`${styles.actionButton} actionButton`}
      onClick={openTerminal}
      title="Open git terminal"
    >
      <TerminalIcon />
    </button>
  );
};

export default OpenTerminalDirButton;
