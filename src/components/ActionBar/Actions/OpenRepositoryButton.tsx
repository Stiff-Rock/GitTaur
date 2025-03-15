import React from 'react';
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from '../../../context/AppContext';

const OpenRepositoryButton: React.FC = () => {
  const { openNewRepo } = useAppContext();

  return (
    <button
      onClick={openNewRepo}
      className='actionButton'
    >
      <FileDirectoryIcon />
    </button>
  );
};

export default OpenRepositoryButton;
