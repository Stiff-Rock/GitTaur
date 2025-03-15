import React, { useState } from 'react';
import styles from './AppTabs.module.css';
import { HistoryIcon, FileDiffIcon, ChecklistIcon } from "@primer/octicons-react";

const AppTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div className={styles.tabs}>
      <div onClick={() => setActiveTab('history')} className={`${styles.tab} ${activeTab === 'history' ? styles.active : styles.inactive}`}>
        <HistoryIcon className={`${activeTab === 'history' ? styles.active : styles.inactive}`} />
        <span>History</span>
      </div>

      <div onClick={() => setActiveTab('changes')} className={`${styles.tab} ${activeTab === 'changes' ? styles.active : styles.inactive}`}>
        <FileDiffIcon className={`${activeTab === 'changes' ? styles.active : styles.inactive}`} />
        <span>Changes</span>
      </div>

      <div onClick={() => setActiveTab('to-do')} className={`${styles.tab} ${activeTab === 'to-do' ? styles.active : styles.inactive}`}>
        <ChecklistIcon className={`${activeTab === 'to-do' ? styles.active : styles.inactive}`} />
        <span>To-Do</span>
      </div>
    </div>
  );
};

export default AppTabs;
