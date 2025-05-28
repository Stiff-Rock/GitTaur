import styles from './ChangesSection.module.css';
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import Throbber from '../../../../Common/Throbber/Throbber';
import { FileItem } from '../LocalChanges';
import { useMainContext } from '../../../../../context/MainContext';
import { ReactNode } from 'react';
import FileStatusChangeItem from '../../../../Common/FileItems/FileChangeStatusItem';

export interface ChangesSectionProps {
  status: FileStatusState
  barIcon: ReactNode;
  sectionTitle: string;
  sectionFileCount: string;
  actionButtons: ReactNode[];
  fileChangesArray: FileChanges[];
  selectedFiles: FileItem[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  isLoading: boolean;
  stagingAreaUpdate: (files: string[]) => void;
  discardChanges: (files: string[]) => void;
}

const ChangesSection: React.FC<ChangesSectionProps> = (props) => {
  const {
    status,
    barIcon,
    sectionTitle,
    sectionFileCount,
    actionButtons,
    fileChangesArray,
    selectedFiles,
    setSelectedFiles,
    isLoading,
    stagingAreaUpdate,
    discardChanges,
  } = props;

  const { repoStatus, inChangesTab } = useMainContext();

  return (
    <div className={`${styles.section} ${inChangesTab ? '' : 'inactive'}`}>
      <div className={`${styles.sectionBar}`}>
        <div className={styles.sectionIcon}>
          {barIcon}
        </div>

        <span className={styles.sectionName}>{sectionTitle}</span>

        <div className={styles.actionsContainer}>
          <span className={styles.sectionFileCount}>{sectionFileCount}</span>
          <Throbber size='small' isVisible={isLoading} />
          {actionButtons}
        </div>
      </div>

      <ScrollBar containerHeight={85} autoHide={true} offset={5}>
        <div className={styles.sectionContent}>
          {repoStatus && fileChangesArray.map((changes, index) => {
            const file: FileItem = { fileName: changes.file, status, changeType: changes.changeType };
            return (
              <FileStatusChangeItem
                key={index}
                file={file}
                fileChangesArray={fileChangesArray}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                stagingAreaUpdate={stagingAreaUpdate}
                discardChanges={discardChanges}
                className={styles.fileChangeItem} />
            );
          })}
        </div>
      </ScrollBar>
    </div >
  );
}

export default ChangesSection;
