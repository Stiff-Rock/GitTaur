import React from 'react';
import styles from './AppTabs.module.css';
import { HistoryIcon, FileDiffIcon, ChecklistIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';
import { AppTabs } from '../../../../types/appTabs';

const AppTabChooser: React.FC = () => {
  const { setCurrentAppTab, currentAppTab } = useMainContext();
  return (
    <div className={styles.tabs}>
      <div
        onClick={() => setCurrentAppTab(AppTabs.CommitHistory)}
        className={`${styles.tab} ${currentAppTab === AppTabs.CommitHistory ? styles.active : styles.inactive}`}
      >
        <HistoryIcon className={`${currentAppTab === AppTabs.CommitHistory ? styles.active : styles.inactive}`} />
        <span>History</span>
      </div>

      <div
        onClick={() => setCurrentAppTab(AppTabs.LocalChanges)}
        className={`${styles.tab} ${currentAppTab === AppTabs.LocalChanges ? styles.active : styles.inactive}`}
      >
        <FileDiffIcon className={`${currentAppTab === AppTabs.LocalChanges ? styles.active : styles.inactive}`} />
        <span>Changes</span>
      </div>

      <div
        onClick={() => setCurrentAppTab(AppTabs.TodoPanel)}
        className={`${styles.tab} ${currentAppTab === AppTabs.TodoPanel ? styles.active : styles.inactive}`}
      >
        <ChecklistIcon className={`${currentAppTab === AppTabs.TodoPanel ? styles.active : styles.inactive}`} />
        <span>To-Do</span>
      </div>
    </div>
  );
};

export default AppTabChooser;
