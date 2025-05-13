import { FoldDownIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';

const UnstageAllButton: React.FC<{ repoPath: string }> = ({ repoPath }) => {
  const unstageAllFiles = () => {
    invoke("", { repoPath });
  }

  return (
    <button onClick={unstageAllFiles} className={`actionButton`}>
      <FoldDownIcon />
    </button>
  );
}

export default UnstageAllButton;
