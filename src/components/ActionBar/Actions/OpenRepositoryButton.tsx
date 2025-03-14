import React from 'react';
import { GoFileDirectory } from "react-icons/go";
import { useAppContext } from '../../../context/AppContext';

const OpenRepositoryButton: React.FC = () => {
  const { openNewRepo } = useAppContext();

  return (
    <GoFileDirectory onClick={openNewRepo} />
  );
};

export default OpenRepositoryButton;
