import React from 'react';
import styles from '../../ActionBar.module.css';
import { DownloadIcon } from '@primer/octicons-react';
import { useAppContext } from '../../../../context/AppContext';

const FetchRepositoryButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  return (
    <button
      onClick={() => setActiveModal("fetch")}
      className={`actionButton ${styles.actionButton}`}
      title='Fetch'
    >
      <DownloadIcon />
    </button>
  );
};

export default FetchRepositoryButton;
