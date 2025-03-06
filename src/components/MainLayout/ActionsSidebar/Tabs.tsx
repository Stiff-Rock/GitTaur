import React, { useState, useEffect } from 'react';
import styles from './Tabs.module.css';
import { GoHistory, GoChecklist, GoFileDiff } from "react-icons/go";

const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    console.log(activeTab);
  }, [activeTab])


  return (
    <div className={styles.tabs}>
      <div onClick={() => setActiveTab('history')} className={`${styles.tab} ${activeTab === 'history' ? styles.active : styles.inactive}`}>
        <GoHistory className={`${activeTab === 'history' ? styles.active : styles.inactive}`} />
        <span>History</span>
      </div>

      <div onClick={() => setActiveTab('changes')} className={`${styles.tab} ${activeTab === 'changes' ? styles.active : styles.inactive}`}>
        <GoFileDiff className={`${activeTab === 'changes' ? styles.active : styles.inactive}`} />
        <span>Changes</span>
      </div>

      <div onClick={() => setActiveTab('to-do')} className={`${styles.tab} ${activeTab === 'to-do' ? styles.active : styles.inactive}`}>
        <GoChecklist className={`${activeTab === 'to-do' ? styles.active : styles.inactive}`} />
        <span>To-Do</span>
      </div>
    </div>
  );
};

export default Tabs;
