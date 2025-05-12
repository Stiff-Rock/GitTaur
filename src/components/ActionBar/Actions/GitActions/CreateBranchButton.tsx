import React from 'react';
import styles from '../../ActionBar.module.css';
import { GitBranchIcon } from '@primer/octicons-react';
import { useAppContext } from '../../../../context/AppContext';

const GitBranchButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  return (
    <button
      onClick={() => setActiveModal("branch")}
      className={`actionButton ${styles.actionButton}`}
      title='Create Branch'
    >
      <GitBranchIcon />
    </button>
  );
};

export default GitBranchButton;
