import styles from './StashesSection.module.css';
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import Throbber from '../../../../Common/Throbber/Throbber';
import { useMainContext } from '../../../../../context/MainContext';
import { ArchiveIcon, FileDiffIcon } from '@primer/octicons-react'
import React, { useState } from 'react';
import FileChangeItem from '../../../../Common/FileItems/FileChangeItem';

const StashesSection: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const { repoStashes, inChangesTab, selectedFile, setSelectedFile } = useMainContext();

  const [selectedStash, setSelectedStash] = useState<Stash | null>(null);

  const StashItem: React.FC<{ stash: Stash }> = ({ stash }) => {
    return (
      <div className={`${styles.stashItem} ${selectedStash === stash && styles.selected}`} onClick={() => setSelectedStash(stash)}>
        <span className={styles.stashName}>{stash.name}</span>
        <span className={styles.stashId}>SHA: {stash.id}</span>
        <span className={styles.stashTimestamp}>DATE: {stash.timestamp}</span>
      </div>
    );
  }

  React.useEffect(() => { console.log("STASHES: ", repoStashes); }, [repoStashes])

  return (
    <>
      <div className={`${styles.section} ${!inChangesTab ? '' : 'inactive'}`}>
        <div className={`${styles.sectionBar}`}>
          <div className={styles.sectionIcon}>
            <ArchiveIcon />
          </div>

          <span className={styles.sectionName}>Stashes</span>

          <div className={styles.actionsContainer}>
            <span className={styles.sectionFileCount}>({repoStashes?.length || 0})</span>
            <Throbber size='small' isVisible={isLoading} />
          </div>
        </div>

        <ScrollBar containerHeight={85} autoHide={true} offset={5}>
          <div className={styles.sectionContent}>
            {repoStashes && repoStashes.map((stash, index) => (
              <StashItem key={index} stash={stash} />
            ))}
          </div>
        </ScrollBar>
      </div >

      <div className={`${styles.section} ${!inChangesTab ? '' : 'inactive'}`}>
        <div className={`${styles.sectionBar}`}>
          <div className={styles.sectionIcon}>
            <FileDiffIcon />
          </div>

          <span className={styles.sectionName}>Changes</span>

          <div className={styles.actionsContainer}>
            <span className={styles.sectionFileCount}>({selectedStash?.contents.length || 0})</span>
          </div>
        </div>

        <ScrollBar containerHeight={85} autoHide={true} offset={5}>
          <div className={styles.sectionContent}>
            {selectedStash && selectedStash.contents.map((file, index) => (
              <FileChangeItem
                key={index}
                onClick={() => setSelectedFile(file.file)}
                changeType={file.changeType}
                fileName={file.file}
                className={`${styles.stashFileChange} ${selectedFile.includes(file.file) ? styles.selected : ''}`}
              />
            ))}
          </div>
        </ScrollBar>
      </div >
    </>
  );
}

export default StashesSection;
