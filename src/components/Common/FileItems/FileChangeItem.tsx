import styles from './FileChangeItem.module.css'
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'

interface FileChangeItemProps {
  changeType: ChangeType;
  fileName: string;
  className?: string;
}

const FileChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { changeType, fileName, className } = props;

  return (
    <div className={`${styles.changeItem} ${className}`}>
      {changeType === "modified" && <DiffIcon className={styles.diffIcon} />}
      {changeType === "added" && <PlusIcon className={styles.plusIcon} />}
      {changeType === "deleted" && <DashIcon className={styles.minusIcon} />}

      <span className={styles.value}>{fileName}</span>
    </div >
  );
}

export default FileChangeItem;
