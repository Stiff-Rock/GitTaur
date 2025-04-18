import React from 'react';
import styles from './AppTabs.module.css';
import { HistoryIcon, FileDiffIcon, ChecklistIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';

const AppTabChooser: React.FC = () => {
  const { setCurrentAppTab, currentAppTab } = useMainContext();
  return (
    <div className={styles.tabs}>
      <div
        onClick={() => setCurrentAppTab("commit-history")}
        className={`${styles.tab} ${currentAppTab === "commit-history" ? styles.active : styles.inactive}`}
      >
        <HistoryIcon className={`${currentAppTab === "commit-history" ? styles.active : styles.inactive}`} />
        <span>History</span>
      </div>

      <div
        onClick={() => setCurrentAppTab("local-changes")}
        className={`${styles.tab} ${currentAppTab === "local-changes" ? styles.active : styles.inactive}`}
      >
        <FileDiffIcon className={`${currentAppTab === "local-changes" ? styles.active : styles.inactive}`} />
        <span>Changes</span>
      </div>

      <div
        onClick={() => setCurrentAppTab("todo-panel")}
        className={`${styles.tab} ${currentAppTab === "todo-panel" ? styles.active : styles.inactive}`}
      >
        <ChecklistIcon className={`${currentAppTab === "todo-panel" ? styles.active : styles.inactive}`} />
        <span>To-Do</span>
      </div>
    </div>
  );
};

export default AppTabChooser;
