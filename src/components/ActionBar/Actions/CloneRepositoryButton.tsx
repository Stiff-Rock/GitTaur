import React from 'react';
import { useAppContext } from "../../../context/AppContext";
import { RepoCloneIcon } from "@primer/octicons-react";

const CloneRepositoryButton: React.FC = () => {
  const { setCloneRepoModalActive } = useAppContext();

  return (
    <button
      onClick={() => setCloneRepoModalActive(true)}
      className='actionButton'
    >
      <RepoCloneIcon />
    </button>
  );
};

export default CloneRepositoryButton;
