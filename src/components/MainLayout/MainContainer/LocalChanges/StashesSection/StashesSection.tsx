import styles from './StashesSection.module.css';
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import Throbber from '../../../../Common/Throbber/Throbber';
import { useMainContext } from '../../../../../context/MainContext';
import { ArchiveIcon, FileDiffIcon } from '@primer/octicons-react'
import React, { useState } from 'react';
import FileChangeItem from '../../../../Common/FileItems/FileChangeItem';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../../../context/AppContext';

const StashesSection: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const { workspace, setNotification } = useAppContext();
  const { repoStashes, inChangesTab, setFileDiff } = useMainContext();

  const [selectedStash, setSelectedStash] = useState<Stash | null>(null);
  const [selectedFileChange, setSelectedFileChange] = useState<string>("");

  const StashItem: React.FC<{ stash: Stash }> = ({ stash }) => {
    return (
      <div className={`${styles.stashItem} ${selectedStash === stash && styles.selected}`} onClick={() => setSelectedStash(stash)}>
        <span className={styles.stashName}>{stash.name}</span>
        <span className={styles.stashId}>SHA: {stash.id.slice(0, 7)}</span>
        <span className={styles.stashTimestamp}>DATE: {stash.timestamp}</span>
      </div>
    );
  }

  const getStashChangeDiff = (filePath: string) => {
    if (!workspace || !selectedStash) return;
    const repoPath = workspace.activeTab;
    const stashId = selectedStash.id;
    invoke<string>("get_file_diff_from_stash", { repoPath, stashId, filePath })
      .then(setFileDiff)
      .catch((e) => {
        console.error(e);
        setNotification(e);
      });
  };

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

        {/*TODO: APPLY & DROP*/}
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
                onClick={() => {
                  setSelectedFileChange(file.file);
                  getStashChangeDiff(file.file);
                }}
                changeType={file.changeType}
                fileName={file.file}
                className={`${styles.stashFileChange} ${selectedFileChange === file.file ? styles.selected : ''}`}
              />
            ))}
          </div>
        </ScrollBar>
      </div >
    </>
  );
}

export default StashesSection;
