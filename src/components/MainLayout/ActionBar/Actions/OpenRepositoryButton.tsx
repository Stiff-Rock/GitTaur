import React from 'react';
import { GoFileDirectory } from "react-icons/go";
import { useAppContext } from '../../../../context/AppContext';

const OpenRepositoryButton: React.FC = () => {
  const { openRepo } = useAppContext();

  return (
    <GoFileDirectory onClick={openRepo} />
  );
};

export default OpenRepositoryButton;
