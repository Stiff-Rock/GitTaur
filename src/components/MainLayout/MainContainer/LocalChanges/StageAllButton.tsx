import { FoldDownIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../context/AppContext';

const StageAllButton: React.FC<{ repoPath: string }> = ({ repoPath }) => {
  const { setNotification } = useAppContext();

  const stageAllFiles = () => {
    invoke("add_to_staging_area", { repoPath, files: [] }).catch((e) => {
      const msg = `Error staging files - ${e}`
      console.error(msg);
      setNotification(msg);
    });
  }

  return (
    <button onClick={stageAllFiles} className={`actionButton`} title='Stage all files'>
      <FoldDownIcon />
    </button>
  );
}

export default StageAllButton;
