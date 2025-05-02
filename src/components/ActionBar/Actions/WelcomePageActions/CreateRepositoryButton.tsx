import styles from '../../ActionBar.module.css';
import React from 'react';
import { useAppContext } from "../../../../context/AppContext";
import { RepoIcon } from "@primer/octicons-react";

const CreateRepositoryButton: React.FC = () => {
  const { setActiveModal } = useAppContext();

  return (
    <button
      onClick={() => setActiveModal("createRepo")}
      className={`actionButton ${styles.actionButton}`}
      title='Create repository'
    >
      <RepoIcon />
    </button>
  );
};

export default CreateRepositoryButton;
