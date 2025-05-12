import React from 'react';
import styles from '../../ActionBar.module.css';
import { MoveToTopIcon } from '@primer/octicons-react';

const PushRepositoryButton: React.FC = () => {
  return (
    <button
      className={`actionButton ${styles.actionButton}`}
      title='Push'
    >
      <MoveToTopIcon />
    </button>
  );
};

export default PushRepositoryButton;
