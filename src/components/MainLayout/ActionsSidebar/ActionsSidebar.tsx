import React from 'react';
import styles from './ActionSidebar.module.css';
import AppTabChooser from './Components/AppTabs';
import InfoAccordions from './Components/InfoAccordions';

const ActionsSidebar: React.FC = () => {
  return (
    <div className={`${styles.actionSidebar}`}>
      <AppTabChooser />
      <InfoAccordions />
    </div >
  );
};

export default ActionsSidebar;
