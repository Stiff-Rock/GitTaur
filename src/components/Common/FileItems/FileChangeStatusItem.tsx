import { Menu, MenuItemOptions } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

interface FileChangeItemProps {
  changeType: ChangeType;
  status: FileStatusState;
  fileName: string;
  selectedFiles: string[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  stagingAreaUpdate: (files: Array<string>) => void,
  className?: string;
}

const FileStatusChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { openContextMenu, workspace, setNotification } = useAppContext();
  const { changeType, status, fileName, selectedFiles, setSelectedFiles, stagingAreaUpdate, className } = props;

  //TODO: STASH
  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    setSelectedFile(fileName);

    if (!workspace) {
      console.error("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }
    const repoPath = workspace.activeTab;

    const menuItems: MenuItemOptions[] = [];

    let statusId;
    let statusText;

    if (status === "unstaged") {
      statusId = "stageFile";
      statusText = "Stage";
    } else {
      statusId = "unstageFile";
      statusText = "Unstage";
    }

    menuItems.push({
      id: statusId,
      text: statusText,
      action: () => {
        stagingAreaUpdate([fileName]);
      },
    })

    if (status === "unstaged") {
      menuItems.push({
        id: 'discardFile',
        text: 'Discard',
        action: () => {
          invoke("discard_changes", { repoPath, files: [fileName] }).catch((e) => {
            console.error("Error discarding changes: ", e);
            setNotification("Error discarding changes: " + e);
          });
        }
      })
    }

    if (changeType !== "deleted") {
      menuItems.push({
        id: 'viewInFileExpl',
        text: "Open in file explorer",
        action: () => {
          join(repoPath, fileName).then((full_path) => revealItemInDir(full_path)).catch((e) => {
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

  //BUG: DOUBLE CLICK STOPPED WORKING
  const handleItemClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      setSelectedFiles(prevSelectedFiles => {
        if (prevSelectedFiles.includes(fileName)) {
          const newSelectedIds = prevSelectedFiles.filter(file => file !== fileName);
          return newSelectedIds;
        }
        else {
          const newSelectedIds = [...prevSelectedFiles, fileName];
          return newSelectedIds;
        }
      });
    } else {
      const newSelectedIds = [fileName];
      setSelectedFiles(newSelectedIds);
    }
  }

  return (
    <div
      className={`${styles.changeItem} ${className} ${selectedFiles.includes(fileName) ? styles.active : ''}`}
      onClick={handleItemClick}
      onDoubleClick={() => stagingAreaUpdate([fileName])}
      onContextMenu={handleOpenContextMenu}
    >
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {fileName}
      </span>
    </div >
  );
}

export default FileStatusChangeItem;
