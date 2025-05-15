import { FoldUpIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../context/AppContext';
import { ActionButtonProps } from './LocalChanges';
import { useMainContext } from '../../../../context/MainContext';

const UnstageAllButton: React.FC<ActionButtonProps> = (props) => {
  const { onActionStart, onActionEnd, statusUpdatePromise } = props;
  const { repoPath } = useMainContext();
  const { setNotification } = useAppContext();

  const unstageAllFiles = async () => {
    onActionStart();

    if (statusUpdatePromise.current) {
      await statusUpdatePromise.current.catch(() => { });
    }

    invoke("remove_from_staging_area", { repoPath, files: [] }).catch((e) => {
      const msg = `Error unstaging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(onActionEnd);
  }

  return (
    <button onClick={unstageAllFiles} className={`actionButton`} title='Unstage all files'>
      <FoldUpIcon />
    </button >
  );
}

export default UnstageAllButton;
