import React from 'react';
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from '../../../context/AppContext';
import styles from '../ActionBar.module.css';

const OpenRepositoryButton: React.FC = () => {
  const { openNewRepo } = useAppContext();

  return (
    <button
      onClick={openNewRepo}
      className={`actionButton ${styles.actionButton}`}
    >
      <FileDirectoryIcon />
    </button>
  );
};

export default OpenRepositoryButton;
