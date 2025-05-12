import React from 'react';
import styles from '../../ActionBar.module.css';
import { DownloadIcon } from '@primer/octicons-react';
import { useAppContext } from '../../../../context/AppContext';
import { invoke } from '@tauri-apps/api/core';

const FetchRepositoryButton: React.FC = () => {
  const { workspace, setNotification } = useAppContext();

  const fetch = () => {
    if (!workspace) return;

    const repo_path = workspace.activeTab;

    invoke("", { repo_path, remote: "" }).then(() => { }).catch((e) => { if (e) { setNotification(e); } });
  }

  return (
    <button
      onClick={fetch}
      className={`actionButton ${styles.actionButton}`}
      title='Fetch'
    >
      <DownloadIcon />
    </button>
  );
};

export default FetchRepositoryButton;
