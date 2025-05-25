
import { Menu } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'

interface FileChangeItemProps {
  changeType: ChangeType;
  state: FileStatusState;
  fileName: string;
  contextMenu: Menu | null;
  stagingAreaUpdate: (files: Array<string>) => void,
  className?: string;
}

const FileStatusChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { openContextMenu } = useAppContext();
  const { changeType, fileName, contextMenu, stagingAreaUpdate, className } = props;

  const handleOpenContextMenu = (event: React.MouseEvent) => {
    if (!contextMenu) return;
    openContextMenu(contextMenu, event);
  }

  //TODO: ON DOUBLE CLICK STAGE/UNSTAGE
  return (
    <div className={`${styles.changeItem} ${className}`} onDoubleClick={() => stagingAreaUpdate([fileName])} onContextMenu={handleOpenContextMenu}>
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}>{fileName}</span>
    </div >
  );
}

export default FileStatusChangeItem;
