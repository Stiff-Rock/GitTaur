import { Menu, MenuItemOptions } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import { openPath } from '@tauri-apps/plugin-opener';
import { join } from '@tauri-apps/api/path';

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
  const { openContextMenu, workspace, setNotification } = useAppContext();
  const { changeType, state, fileName, selectedFile, setSelectedFile, stagingAreaUpdate, className } = props;

  //TODO: STASH, DISCARD ONLY IN UNSTAGED
  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    setSelectedFile(fileName);

    const statusId = state.slice(0, state.length - 1);
    const statusText = statusId.charAt(0).toUpperCase() + statusId.slice(1);

    const menuItems: MenuItemOptions[] = [];

    menuItems.push({
      id: statusId,
      text: statusText,
      action: () => {
        stagingAreaUpdate([fileName]);
      },
    })

    if (changeType !== "deleted") {
      menuItems.push({
        id: 'viewInFileExpl',
        text: "Open in file explorer",
        action: () => {
          if (!workspace) {
            console.error("Error while opening file in file explorer: Unexpected null workspace");
            setNotification("Could not open file in file exlorer due to an internal error");
            return;
          }

          const repoPath = workspace.activeTab;
          join(repoPath, fileName).then((full_path) => openPath(full_path)).catch((e) => {
            console.error("Error while opening file in file explorer: ", e);
            setNotification("Could not open file in file exlorer: " + e);
          })
        },
      })
    }

    const contextMenu = await Menu.new({
      items: menuItems
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
