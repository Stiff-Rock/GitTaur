import React from 'react';
import styles from "./WindowTabs.module.css";
import { GoX, GoDatabase, GoRepo } from "react-icons/go";

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick, onClose }) => {
  const handleCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onClose();
  };

  return (
    <div onClick={onClick} onAuxClick={handleCloseClick} className={`${styles.tab} ${isActive ? styles.active : ''}`}>
      {label === "Welcome Page" ? <GoDatabase className={`${styles.tabIcon}`} /> : <GoRepo className={`${styles.tabIcon}`} />}
      <span>{label}</span>
      <GoX className={`${styles.closeIcon}`} onClick={handleCloseClick} />
    </div>
  );
};

export default Tab;
