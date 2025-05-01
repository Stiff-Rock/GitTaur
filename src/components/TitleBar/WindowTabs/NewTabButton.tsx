import { PlusIcon } from '@primer/octicons-react';
import styles from '../TitleBar.module.css';
import React from 'react';
import { useAppContext } from '../../../context/AppContext';

const NewTabButton: React.FC = () => {
  const { openWelcomePage } = useAppContext();

  const handleNewTabClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    openWelcomePage()
  }

  return (
    <button
      className={`${styles.titleBarIcon} actionButton`}
      title="Open new tab"
      onClick={handleNewTabClick}
    >
      <PlusIcon />
    </button>
  );
};

export default NewTabButton;
