import React from 'react';
import { useAppContext } from "../../../../context/AppContext";
import { RepoCloneIcon } from "@primer/octicons-react";
import styles from '../../ActionBar.module.css';

const CloneRepositoryButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  //TODO: IF SUCCESSUL, OPEN IT
  return (
    <button
      onClick={() => setActiveModal("cloneRepo")}
      className={`actionButton ${styles.actionButton}`}
      title='Clone repository'
    >
      <RepoCloneIcon />
    </button>
  );
};

export default CloneRepositoryButton;
