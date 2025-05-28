import styles from './FileChangeItem.module.css'
import { Menu, MenuItemOptions } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { join } from '@tauri-apps/api/path';
import { useEffect, useRef } from 'react';
import { FileItem } from '../../MainLayout/MainContainer/LocalChanges/LocalChanges';
import { useMainContext } from '../../../context/MainContext';

interface FileChangeItemProps {
  file: FileItem
  fileChangesArray: FileChanges[]
  selectedFiles: FileItem[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  stagingAreaUpdate: (files: string[]) => void
  discardChanges: (files: string[]) => void
  className?: string
}

const FileStatusChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { openContextMenu, workspace, setNotification } = useAppContext();
  const { setSelectedChange } = useMainContext();
  const { file, fileChangesArray, selectedFiles, setSelectedFiles, stagingAreaUpdate, discardChanges, className } = props;
  const { fileName, changeType, status } = file;

  //TODO: STASH
  //BUG: TOGGLE AFTER SHIFT SELECT IS BUGGED AS HELL
  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    const currentSelectedFiles = selectedFiles.some(f => f.fileName === fileName)
      ? selectedFiles
      : [file];
    setSelectedFiles(currentSelectedFiles);
    const files = currentSelectedFiles.map(f => f.fileName);

    if (!workspace) {
      console.error("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    // Build the context menu items
    const menuItems: MenuItemOptions[] = [];

    // Action to stage/unstage the file
    menuItems.push({
      id: status === "unstaged" ? "stageFile" : "unstageFile",
      text: status === "unstaged" ? "Stage" : "Unstage",
      action: () => { stagingAreaUpdate(files) },
    })

    // Action to discard a unstaged file
    if (status === "unstaged") {
      menuItems.push({
        id: 'discardFile',
        text: 'Discard',
        action: () => { discardChanges(files) },
      })
    }

    // Action to view an existing file in the systems file explorer
    if (setSelectedFiles.length === 1 && changeType !== "deleted") {
      menuItems.push({
        id: 'viewInFileExpl',
        text: "Open in file explorer",
        action: () => {
          join(workspace.activeTab, fileName).then((full_path) => revealItemInDir(full_path)).catch((e) => {
            console.error("Error while opening file in file explorer: ", e);
            setNotification("Could not open file in file exlorer: " + e);
          })
        },
      })
    }

    openContextMenu(await Menu.new({ items: menuItems }), event);
  }

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleItemClick = (event: React.MouseEvent) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    clickTimerRef.current = setTimeout(() => {
      if (event.ctrlKey || event.metaKey) {
        setSelectedFiles(prev => {
          if (prev.length > 0 && prev[0].status !== status) {
            return [file];
          }
          else if (prev.some(f => f.fileName === file.fileName)) {
            return prev.filter(f => f.fileName !== file.fileName);
          } else {
            return [...prev, file];
          }
        });
      } else if (event.shiftKey) {
        const lastSelectedFile = selectedFiles.at(-1);

        const lastIndex = fileChangesArray.findIndex(c => c.file === lastSelectedFile?.fileName);
        const currentIndex = fileChangesArray.findIndex(c => c.file === fileName);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastIndex, currentIndex);
          const endIndex = Math.max(lastIndex, currentIndex);

          const filesToSelect = fileChangesArray
            .slice(startIndex, endIndex + 1)
            .map(change => ({
              fileName: change.file,
              status,
              changeType: change.changeType
            }));

          setSelectedFiles(filesToSelect);
        } else {
          setSelectedFiles([file]);
        }
      } else {
        setSelectedFiles([file]);
      }

      clickTimerRef.current = null;
    }, 20);
  }

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    stagingAreaUpdate([fileName]);
  };

  const isSelected = useRef(false);
  useEffect(() => {
    if (!selectedFiles) return;

    isSelected.current = selectedFiles.some(f => f.fileName === file.fileName)

    if (isSelected.current && selectedFiles.at(-1)?.fileName === fileName) {
      setSelectedChange({ name: fileName, status });
    }

  }, [selectedFiles])

  return (
    <div
      className={`${styles.changeItem} ${className} ${isSelected.current ? styles.active : ''}`}
      onContextMenu={handleOpenContextMenu}
      onClick={handleItemClick}
      onDoubleClick={handleDoubleClick}
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
