import { Menu } from '@tauri-apps/api/menu';
import { useAppContext } from '../../../context/AppContext';
import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'

interface FileChangeItemProps {
  changeType: ChangeType;
  state: FileStatusState;
  fileName: string;
  contextMenu: Menu | null;
  className?: string;
}

const FileChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { openContextMenu } = useAppContext();
  const { changeType, fileName, contextMenu, className } = props;

  //TODO: EN VEZ DE HAZCER AQUI EL INVOKE, SUBIR AL PADRE (LOCALCHANGES) LA FUNCION PARA QUE PUEDA GESTIONARLO TENIENOD EN CUNETA LOS REFS
  const handleDoubleClick = () => {

  }

  const handleOpenContextMenu = (event: React.MouseEvent) => {
    if (!contextMenu) return;
    openContextMenu(contextMenu, event);
  }

  //TODO: ON DOUBLE CLICK STAGE/UNSTAGE
  return (
    <div className={`${styles.changeItem} ${className}`} onDoubleClick={handleDoubleClick} onContextMenu={handleOpenContextMenu}>
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}>{fileName}</span>
    </div >
  );
}

export default FileChangeItem;
