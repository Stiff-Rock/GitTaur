import React from 'react';
import styles from "./WindowTabs.module.css";
import { DatabaseIcon, GearIcon, RepoIcon, XIcon } from "@primer/octicons-react";

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, onClose }) => {
  const handleCloseClick = (event: React.MouseEvent) => {
    if (event.button === 1) {
      event.stopPropagation();
      event.preventDefault();
      onClose();
    }
  };

  const handleXClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onClose();
  };

  return (
    <div onClick={onClick} onAuxClick={handleCloseClick} className={`${styles.tab} ${isActive ? styles.active : ''}`}>
      {label === "Welcome Page" ?
        <DatabaseIcon className={`${styles.tabIcon}`} />
        :
        label === "Configuration" ? <GearIcon className={`${styles.tabIcon}`} /> :
          <RepoIcon className={`${styles.tabIcon}`} />
      }
      <span>{label}</span>
      <button
        className='actionButton'
        title='Close tab'
        onClick={handleXClick}
      >
        <XIcon className={`${styles.closeIcon}`} />
      </button>
    </div >
  );
};

export default Tab;
