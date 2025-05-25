
import { Menu } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'

interface FileChangeItemProps {
  changeType: ChangeType;
  state: FileStatusState;
  fileName: string;
  selectedFile: string
  setSelectedFile: React.Dispatch<React.SetStateAction<string>>;
  stagingAreaUpdate: (files: Array<string>) => void,
  className?: string;
}

const FileStatusChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { openContextMenu } = useAppContext();
  const { changeType, state, fileName, selectedFile, setSelectedFile, stagingAreaUpdate, className } = props;

  //TODO: STASH, DISCARD, OPEN IN FILE EXPLORER
  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    setSelectedFile(fileName);

    const id = state.slice(0, state.length - 1);
    const text = id.charAt(0).toUpperCase() + id.slice(1);

    const contextMenu = await Menu.new({
      items: [
        {
          id,
          text,
          action: () => {
            stagingAreaUpdate([fileName]);
          },
        },
      ],
    });

    openContextMenu(contextMenu, event);
  }

  return (
    <div
      className={`${styles.changeItem} ${className} ${selectedFile === fileName ? styles.active : ''}`}
      onClick={() => setSelectedFile(fileName)}
      onDoubleClick={() => stagingAreaUpdate([fileName])}
      onContextMenu={handleOpenContextMenu}
    >
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}>{fileName}</span>
    </div >
  );
}

export default FileStatusChangeItem;
