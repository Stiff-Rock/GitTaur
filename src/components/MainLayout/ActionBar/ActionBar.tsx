import React from 'react';
import styles from './ActionBar.module.css';
import ActionBarTabs from './Actions/ActionBarTabs';

const ActionBar: React.FC = () => {
  return (
    <div className={`${styles.actionBar}`}>
      <ActionBarTabs />
    </div>
  );
};

export default ActionBar;
