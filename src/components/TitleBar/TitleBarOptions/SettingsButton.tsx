import { GearIcon } from '@primer/octicons-react';
import styles from '../TitleBar.module.css';
import React from 'react';

const SettingsButton: React.FC = () => {

  return (
    <button
      className={`${styles.titleBarIcon} actionButton`}
      style={{ marginRight: "5px" }}
      title="Settings"
    >
      <GearIcon />
    </button>
  );
};

export default SettingsButton;
