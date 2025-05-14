import { FoldDownIcon } from '@primer/octicons-react'
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../context/AppContext';
import { ActionButtonProps } from './LocalChanges';

const StageAllButton: React.FC<ActionButtonProps> = (props) => {
  const { repoPath, onActionStart, onActionEnd, statusUpdatePromise } = props;
  const { setNotification } = useAppContext();

  const stageAllFiles = async () => {
    onActionStart();

    if (statusUpdatePromise.current) {
      console.log("STAGE WATING PROMISE")
      await statusUpdatePromise.current.catch(() => { });
    }

    console.log("STAGE EXECUTE")
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
