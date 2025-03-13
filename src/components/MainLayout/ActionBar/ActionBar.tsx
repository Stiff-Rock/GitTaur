import React from 'react';
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
  const { isInWelcomePage } = useAppContext();

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

