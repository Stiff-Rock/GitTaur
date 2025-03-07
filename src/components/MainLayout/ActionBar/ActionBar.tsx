import React from 'react';
import styles from './ActionBar.module.css';
import { GoGitCommit, GoGitBranch, GoTerminal, GoFileDirectory, GoMoveToBottom, GoMoveToTop, GoDownload } from "react-icons/go";

const ActionBar: React.FC = () => {
  return (
    <div className={`${styles.actionBar}`}>
      <div className={`${styles.actions} ${styles.leftActions}`}>
        <GoFileDirectory />
        <GoTerminal />
      </div>
      <div className={`${styles.actions} ${styles.centerActions}`}>
        <GoDownload />
        <GoMoveToBottom />
        <GoMoveToTop />
        <GoGitCommit />
        <GoGitBranch />
      </div>
      <div className={`${styles.actions} ${styles.rightActions}`} />
    </div>
  );
};

export default ActionBar;

