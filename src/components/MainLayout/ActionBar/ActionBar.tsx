import React, { useState, useEffect } from 'react';
import styles from './ActionBar.module.css';
import {
  GoGitCommit,
  GoGitBranch,
  GoTerminal,
  GoMoveToBottom,
  GoMoveToTop,
  GoDownload,
  GoProjectSymlink,
  GoDuplicate
} from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';
import OpenRepositoryButton from './Actions/OpenRepositoryButton';

const ActionBar: React.FC = () => {
  const { activeTab } = useAppContext();
  const [isInWelcomePage, setIsInWelcomePage] = useState(false);

  useEffect(() => {
    const inWelcomePage = activeTab === "Welcome Page"
    if (isInWelcomePage !== inWelcomePage) {
      setIsInWelcomePage(inWelcomePage);
    }
  }, [activeTab])

  return (
    <div className={`${styles.actionBar}`}>
      <div className={`${styles.actions} ${styles.leftActions}`}>
        {isInWelcomePage ?
          (
            <>
              <OpenRepositoryButton />
              <GoDuplicate />
            </>
          ) : (
            <GoProjectSymlink />
          )}
        <GoTerminal />
      </div>
      <div className={`${styles.actions} ${styles.centerActions}`}>
        {!isInWelcomePage && (
          <>
            <GoDownload />
            <GoMoveToBottom />
            <GoMoveToTop />
            <GoGitCommit />
            <GoGitBranch />
          </>
        )}
      </div>

      <div className={`${styles.actions} ${styles.rightActions}`} />
    </div>
  );
};

export default ActionBar;

