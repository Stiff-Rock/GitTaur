import styles from './AppTabs.module.css';
import React, { useEffect, useState } from 'react';
import { HistoryIcon, FileDiffIcon, ChecklistIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';

const AppTabChooser: React.FC = () => {
  const { setCurrentAppTab, currentAppTab, repoStatus } = useMainContext();
  const [totalChanges, setTotalChanges] = useState<number>(0);

  useEffect(() => {
    if (!repoStatus) return;
    setTotalChanges(repoStatus.unstagedFiles.length + repoStatus.stagedFiles.length);
  }, [repoStatus])

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
        {totalChanges > 0 && <div className={styles.changesStatusIndicator}>{totalChanges > 999 ? '+999' : totalChanges}</div>}
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
