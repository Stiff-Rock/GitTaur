import React from 'react';
import styles from '../../ActionBar.module.css';
import { MoveToBottomIcon } from '@primer/octicons-react';
import { useAppContext } from '../../../../context/AppContext';

const PullRepositoryButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  return (
    <button
      onClick={() => setActiveModal("pull")}
      className={`actionButton ${styles.actionButton}`}
      title='Pull'
    >
      <MoveToBottomIcon />
    </button>
  );
};

export default PullRepositoryButton;
