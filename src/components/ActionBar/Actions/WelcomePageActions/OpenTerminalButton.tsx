import React from 'react';
import { TerminalIcon } from "@primer/octicons-react";
import styles from '../../ActionBar.module.css';
import { useAppContext } from '../../../../context/AppContext';
import { invoke } from '@tauri-apps/api/core';

const OpenTerminalDirButton: React.FC = () => {
  const { setNotification, workspace, checkPageType } = useAppContext();

  const openTerminal = () => {
    if (!workspace) return;

    const path = checkPageType("Welcome") || checkPageType("Config") ? "" : workspace.activeTab;

    invoke('open_terminal', { path }).catch((e) => {
      console.error(e);
      setNotification("Failed to open terminal: " + e)
    });
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
