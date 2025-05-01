import { CodespacesIcon } from '@primer/octicons-react';
import styles from '../TitleBar.module.css';
import React from 'react';

const WorkspaceButton: React.FC = () => {

  return (
    <button
      className={`${styles.titleBarIcon} actionButton`}
      style={{ marginLeft: "5px" }}
      title="Switch Workspace"
    >
      <CodespacesIcon />
    </button>
  );
};

export default WorkspaceButton;
