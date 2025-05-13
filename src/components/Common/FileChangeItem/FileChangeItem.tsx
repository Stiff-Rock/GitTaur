import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import styles from './FileChangeItem.module.css'

interface FileChangeItemProps {
  changeType: ChangeType;
  fileName: string;
}

const FileChangeItem: React.FC<FileChangeItemProps> = (props) => {
  const { changeType, fileName } = props;

  return (
    <div className={styles.changeItem}>
      <span className={styles.changeType}>
        {changeType === "modified" ? (
          <DiffIcon className={styles.diffIcon} />
        ) : changeType === "added" ? (
          <PlusIcon className={styles.plusIcon} />
        ) : changeType === "deleted" ? (
          <DashIcon className={styles.minusIcon} />
        ) : (<span>Error</span>)}
      </span>
      <span className={styles.value}>{fileName}</span>
    </div>
  );
}

export default FileChangeItem;
