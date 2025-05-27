import styles from './StashesSection.module.css';
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import Throbber from '../../../../Common/Throbber/Throbber';
import { useMainContext } from '../../../../../context/MainContext';
import { ArchiveIcon, FileDiffIcon } from '@primer/octicons-react'
import FileStatusChangeItem from '../../../../Common/FileItems/FileChangeStatusItem';
import { useState } from 'react';

export interface StashesSectionProps {
  stashes: string[]
  isLoading: boolean;
}

const StashesSection: React.FC<StashesSectionProps> = (props) => {
  const { isLoading, stashes } = props;
  const { repoStatus } = useMainContext();

  const [selectedStash, setSelectedStash] = useState<string[]>([]);

  return (
    <>
      <div className={`${styles.section}`}>
        <div className={`${styles.sectionBar}`}>
          <div className={styles.sectionIcon}>
            <ArchiveIcon />
          </div>

          <span className={styles.sectionName}>Stashes</span>

          <div className={styles.actionsContainer}>
            <span className={styles.sectionFileCount}>({stashes.length})</span>
            <Throbber size='small' isVisible={isLoading} />
          </div>
        </div>

        <ScrollBar autoHide={true} offset={5}>
          <div className={styles.sectionContent}>
            {repoStatus && stashes.map((_stash, _index) => (
              <></>
            ))}
          </div>
        </ScrollBar>
      </div >

      <div className={`${styles.section}`}>
        <div className={`${styles.sectionBar}`}>
          <div className={styles.sectionIcon}>
            <FileDiffIcon />
          </div>

          <span className={styles.sectionName}>Changes</span>

          <div className={styles.actionsContainer}>
            <span className={styles.sectionFileCount}>({selectedStash.length})</span>
          </div>
        </div>

        <ScrollBar autoHide={true} offset={5}>
          <div className={styles.sectionContent}>
            {repoStatus && selectedStash.map((_change, _index) => (
              <FileStatusChangeItem
                key={index}
                file={file}
                fileChangesArray={fileChangesArray}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                stagingAreaUpdate={stagingAreaUpdate}
                discardChanges={discardChanges}
                className={styles.fileChangeItem} />
            ))}
          </div>
        </ScrollBar>
      </div >
    </>
  );
}

export default StashesSection;
