import React from 'react';
import { TerminalIcon } from "@primer/octicons-react";
import styles from '../ActionBar.module.css';
import { Command } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import { useAppContext } from '../../../context/AppContext';
import { invoke } from '@tauri-apps/api/core';

const OpenTerminalDirButton: React.FC = () => {
  const { setNotification, workspace } = useAppContext();

  //TODO: CHECK IF IT WORKS IN MAC AND LINUX
  //TODO: USER COFIG GIT BASH PATH
  const openTerminal = async () => {
    const PROJECT_PATH = workspace?.activeTab;
    try {
      const os = platform();

      if (os === 'windows') {
        try {
          await Command.create('git-bash', [
            '-c',
            `cd "${PROJECT_PATH}" && exec bash --login`
          ]).spawn();
        } catch (error) {
          setNotification("Failed to open temrinal: " + error);
          console.error(error);
        }
      } else {
        //TODO: OTHER OS DONT WORK
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <button
      className={`${styles.actionButton} actionButton`}
      onClick={() => {
        invoke('open_terminal')
        .then(() => console.log('Terminal opened'))
        .catch((error) => console.error('Error opening terminal:', error));
      }}
      title="Open git terminal"
    >
      <TerminalIcon />
    </button>
  );
};

export default OpenTerminalDirButton;
