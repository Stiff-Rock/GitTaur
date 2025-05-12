import React from 'react';
import styles from '../../ActionBar.module.css';
import { MoveToBottomIcon } from '@primer/octicons-react';

const PullRepositoryButton: React.FC = () => {
  return (
    <button
      className={`actionButton ${styles.actionButton}`}
      title='Pull'
    >
      <MoveToBottomIcon />
    </button>
  );
};

export default PullRepositoryButton;
