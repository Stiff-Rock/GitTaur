import React from 'react';
import styles from '../../ActionBar.module.css';
import { MoveToTopIcon } from '@primer/octicons-react';
import { useAppContext } from '../../../../context/AppContext';

const PushRepositoryButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  return (
    <button
      onClick={() => setActiveModal("push")}
      className={`actionButton ${styles.actionButton}`}
      title='Push'
    >
      <MoveToTopIcon />
    </button>
  );
};

export default PushRepositoryButton;
