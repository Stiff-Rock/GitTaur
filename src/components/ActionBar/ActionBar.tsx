import React from 'react';
import styles from './ActionBar.module.css';
import {
  FileDirectorySymlinkIcon,
  TerminalIcon,
  GitCommitIcon,
  DownloadIcon,
  MoveToBottomIcon,
  MoveToTopIcon,
  GitBranchIcon,
  PersonIcon,
} from "@primer/octicons-react";
import { useAppContext } from '../../context/AppContext';
import OpenRepositoryButton from './Actions/OpenRepositoryButton';
import CloneRepositoryButton from './Actions/CloneRepositoryButton';

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
            </>
          ) : (
            <button
              className={`actionButton ${styles.actionButton}`}
            >
              <FileDirectorySymlinkIcon />
            </button>
          )}
        <TerminalIcon />
      </div>
      <div className={`${styles.actions} ${styles.centerActions}`}>
        {!isInWelcomePage && (
          <>
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
          </>
        )}
      </div>

      <div className={`${styles.actions} ${styles.rightActions}`}>
        {!isInWelcomePage && (
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
        )}
      </div>
    </div>
  );
};

export default ActionBar;
