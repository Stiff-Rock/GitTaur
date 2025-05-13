import { FoldUpIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';

const StageAllButton: React.FC<{ repoPath: string }> = ({ repoPath }) => {
  const stageAllFiles = () => {
    invoke("", { repoPath });
  }

  return (
    <button onClick={stageAllFiles} className={`actionButton`}>
      <FoldUpIcon />
    </button>
  );
}

export default StageAllButton;
