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
            <FileDirectorySymlinkIcon />
          )}
        <TerminalIcon />
      </div>
      <div className={`${styles.actions} ${styles.centerActions}`}>
        {!isInWelcomePage && (
          <>
            <DownloadIcon />
            <MoveToBottomIcon />
            <MoveToTopIcon />
            <GitCommitIcon />
            <GitBranchIcon />
          </>
        )}
      </div>

      <div className={`${styles.actions} ${styles.rightActions}`} />
    </div>
  );
};

export default ActionBar;
