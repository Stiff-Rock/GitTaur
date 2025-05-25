import { GearIcon } from '@primer/octicons-react';
import styles from '../TitleBar.module.css';
import React from 'react';
import { useAppContext } from '../../../context/AppContext';

const SettingsButton: React.FC = () => {
  const { openConfigPage } = useAppContext();

  return (
    <button
      className={`${styles.titleBarIcon} actionButton`}
      onClick={openConfigPage}
      /*TODO: WHILE NO WORKSPACE BUTTON, NO NEED FOR THIS style={{ marginRight: "5px" }}*/
      title="Settings"
    >
      <GearIcon />
    </button>
  );
};

export default SettingsButton;
