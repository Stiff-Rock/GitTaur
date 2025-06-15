import React from 'react';
import styles from './ActionBar.module.css';
//import { PersonIcon } from "@primer/octicons-react";
import { useAppContext } from '../../context/AppContext';
import OpenRepositoryButton from './Actions/WelcomePageActions/OpenRepositoryButton';
import CloneRepositoryButton from './Actions/WelcomePageActions/CloneRepositoryButton';
import OpenRepoDirButton from './Actions/WelcomePageActions/OpenRepoDirButton';
import OpenTerminalDirButton from './Actions/WelcomePageActions/OpenTerminalButton';
import CreateRepositoryButton from './Actions/WelcomePageActions/CreateRepositoryButton';
import FetchRepositoryButton from './Actions/GitActions/FetchRepositoryButton';
import PullRepositoryButton from './Actions/GitActions/PullRepositoryButton';
import PushRepositoryButton from './Actions/GitActions/PushRepositoryButton';
import GitBranchButton from './Actions/GitActions/CreateBranchButton';

const ActionBar: React.FC = () => {
  const { isType } = useAppContext();

  return (
    <div className={`${styles.actionBar}`}>
      <div className={`${styles.actions} ${styles.leftActions}`}>
        {isType("Welcome") ?
          (
            <>
              <OpenRepositoryButton />
              <CloneRepositoryButton />
              <CreateRepositoryButton />
            </>
          ) : isType("Config") ? (<></>) : (
            <OpenRepoDirButton />
          )}
        <OpenTerminalDirButton />
      </div>

      {!isType("Welcome") && !isType("Config") && (
        <div className={`${styles.actions} ${styles.centerActions}`}>
          <FetchRepositoryButton />

          <PullRepositoryButton />

          <PushRepositoryButton />

          <GitBranchButton />
        </div>
      )}


      <div className={`${styles.actions} ${styles.rightActions}`}>
        {/*SYNC GITHUB ACCOUNT
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
        */}
      </div>
    </div>
  );
};

export default ActionBar;
