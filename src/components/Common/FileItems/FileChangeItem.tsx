import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'

interface FileChangeItemProps {
  changeType: ChangeType;
  fileName: string;
  onClick?: () => void;
  className?: string;
}

const FileChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { changeType, onClick, fileName, className } = props;

  return (
    <div className={`${styles.changeItem} ${className}`} onClick={onClick}>
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}>{fileName}</span>
    </div >
  );
}

export default FileChangeItem;
