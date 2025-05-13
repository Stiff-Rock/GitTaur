import styles from './LocalChanges.module.css';
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import FileChangeItem from "../../../Common/FileChangeItem/FileChangeItem";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './StageAllButton';
import UnstageAllButton from './UnstageAllButton';

interface LocalChangesProps {
  repoPath: string;
}

const LocalChanges: React.FC<LocalChangesProps> = ({ repoPath }) => {
  const { currentAppTab, repoInfo, repoStatus, setRepoStatus } = useMainContext();
  const { setNotification } = useAppContext();

  //TODO: DELETE ON RELEASE
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!repoInfo || hasLoaded.current) return;
    hasLoaded.current = true;

    invoke("watch_git_status", { repoPath })
      .catch(e => console.error("Error starting git watcher:", e));

    const unlistenPromise = listen<string>("git-status-changed", (event) => {
      if (event.payload === repoPath) {
        invoke<RepoStatus>("get_repo_status", { repoPath })
          .then(setRepoStatus)
          .catch(e => setNotification(e));
      }
    });

    invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch((e) => { console.error(e); setNotification(e); })

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [repoInfo]);

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div className={`${styles.sectionTitle} ${styles.unstagedSectionTitle}`}>
        <DiffModifiedIcon />
        <span>Unstaged Files</span>
        <span>({repoStatus?.unstagedFiles.length || 0})</span>
        <div className={styles.actionsContainer}>
          <StageAllButton />
        </div>
      </div>
      <div className={`${styles.section}`}>
        {repoStatus && repoStatus.unstagedFiles.map((changes, index) => (
          <FileChangeItem key={index} fileName={changes.file} changeType={changes.changeType} className={styles.fileChangeItem} />
        ))}
      </div>

      <div className={`${styles.sectionTitle} ${styles.stagedSectionTitle}`}>
        <CheckboxIcon />
        <span>Staged Files</span>
        <span>({repoStatus?.stagedFiles.length || 0})</span>
        <div className={styles.actionsContainer}>
          <UnstageAllButton />
        </div>
      </div>
      <div className={`${styles.section}`}>
        {repoStatus && repoStatus.stagedFiles.map((changes, index) => (
          <FileChangeItem key={index} fileName={changes.file} changeType={changes.changeType} className={styles.fileChangeItem} />
        ))}
      </div>
    </div >
  );
};

export default LocalChanges;
