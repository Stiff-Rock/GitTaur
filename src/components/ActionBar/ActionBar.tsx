import React from 'react';
import styles from './ActionBar.module.css';
import {
  GitCommitIcon,
  DownloadIcon,
  MoveToBottomIcon,
  MoveToTopIcon,
  GitBranchIcon,
  PersonIcon,
} from "@primer/octicons-react";
import { useAppContext } from '../../context/AppContext';
import OpenRepositoryButton from './Actions/WelcomePageActions/OpenRepositoryButton';
import CloneRepositoryButton from './Actions/WelcomePageActions/CloneRepositoryButton';
import OpenRepoDirButton from './Actions/WelcomePageActions/OpenRepoDirButton';
import OpenTerminalDirButton from './Actions/WelcomePageActions/OpenTerminalButton';
import CreateRepositoryButton from './Actions/WelcomePageActions/CreateRepositoryButton';

const ActionBar: React.FC = () => {
  const { isInWelcomePage } = useAppContext();

  return (
    <div className={`${styles.actionBar}`}>
      <div className={`${styles.actions} ${styles.leftActions}`}>
        {isInWelcomePage ?
          (
            <>
              <OpenRepositoryButton />
              <CloneRepositoryButton />
              <CreateRepositoryButton />
            </>
          ) : (
            <OpenRepoDirButton />
          )}
        <OpenTerminalDirButton />
      </div>

      {!isInWelcomePage && (
        <div className={`${styles.actions} ${styles.centerActions}`}>
          <button
            className={`actionButton ${styles.actionButton}`}
          >
            <DownloadIcon />
          </button>
          <button
            className={`actionButton ${styles.actionButton}`}
          >
            <MoveToBottomIcon />
          </button>
          <button
            className={`actionButton ${styles.actionButton}`}
          >
            <MoveToTopIcon />
          </button>
          <button
            className={`actionButton ${styles.actionButton}`}
          >
            <GitCommitIcon />
          </button>
          <button
            className={`actionButton ${styles.actionButton}`}
          >
            <GitBranchIcon />
          </button>
        </div>
      )}

      {!isInWelcomePage && (
        <div className={`${styles.actions} ${styles.rightActions}`}>
          <button className={`actionButton ${styles.actionButton}`}>
            <svg
              className={styles.userAccountBg}
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <circle cx="12" cy="12" r="12" fill="var(--secondary-bg)" />
              <foreignObject x="0" y="0" width="24" height="24">
                <PersonIcon className={styles.userAccountIcon} />
              </foreignObject>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionBar;
