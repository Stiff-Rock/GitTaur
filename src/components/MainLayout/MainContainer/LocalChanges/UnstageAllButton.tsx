import { FoldUpIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../context/AppContext';

const UnstageAllButton: React.FC<{ repoPath: string }> = ({ repoPath }) => {
  const { setNotification } = useAppContext();

  const unstageAllFiles = () => {
    invoke("remove_from_staging_area", { repoPath, files: [] }).catch((e) => {
      const msg = `Error unstaging files - ${e}`
      console.error(msg);
      setNotification(msg);
    });
  }

  return (
    <button onClick={unstageAllFiles} className={`actionButton`} title='Unstage all files'>
      < FoldUpIcon />
    </button >
  );
}

export default UnstageAllButton;
