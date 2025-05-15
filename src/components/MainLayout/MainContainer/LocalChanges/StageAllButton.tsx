import { FoldDownIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../context/AppContext';
import { ActionButtonProps } from './LocalChanges';
import { useMainContext } from '../../../../context/MainContext';

const StageAllButton: React.FC<ActionButtonProps> = (props) => {
  const { onActionStart, onActionEnd, statusUpdatePromise } = props;
  const { repoPath } = useMainContext();
  const { setNotification } = useAppContext();

  const stageAllFiles = async () => {
    onActionStart();

    if (statusUpdatePromise.current) {
      await statusUpdatePromise.current.catch(() => { });
    }

    invoke("add_to_staging_area", { repoPath, files: [] }).catch((e) => {
      const msg = `Error staging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(onActionEnd);
  }

  return (
    <button onClick={stageAllFiles} className={`actionButton`} title='Stage all files'>
      <FoldDownIcon />
    </button>
  );
}

export default StageAllButton;
