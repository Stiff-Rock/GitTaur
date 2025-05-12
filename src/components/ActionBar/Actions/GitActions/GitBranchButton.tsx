import React from 'react';
import styles from '../../ActionBar.module.css';
import { GitBranchIcon } from '@primer/octicons-react';

const GitBranchButton: React.FC = () => {
  return (
    <button
      className={`actionButton ${styles.actionButton}`}
      title='Create Branch'
    >
      <GitBranchIcon />
    </button>
  );
};

export default GitBranchButton;
