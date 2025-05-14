import styles from './LocalChanges.module.css';
import { ReactNode, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import FileChangeItem from "../../../Common/FileChangeItem/FileChangeItem";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './StageAllButton';
import UnstageAllButton from './UnstageAllButton';
import Scrollbars from 'react-custom-scrollbars-2';

const LocalChanges: React.FC<{ repoPath: string }> = ({ repoPath }) => {
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

  interface ChangesSectionProps {
    sectionBarStyle: string;
    barIcon: ReactNode;
    sectionTitle: string;
    actionButtons: ReactNode[];
    fileChangesArray: FileChanges[];
  }

  const ChangesSection: React.FC<ChangesSectionProps> = (props) => {
    const { sectionBarStyle, barIcon, sectionTitle, actionButtons, fileChangesArray } = props;
    return (
      <div className={`${styles.section}`}>
        <div className={`${styles.sectionBar} ${sectionBarStyle}`}>
          <div className={styles.sectionIcon}>
            {barIcon}
          </div>

          <div className={styles.sectionName}>
            <span>{sectionTitle}</span>
          </div>

          <div className={styles.actionsContainer}>
            {actionButtons}
          </div>
        </div>

        <Scrollbars
          autoHide
          autoHideTimeout={500}
          autoHideDuration={300}
          renderThumbVertical={({ style, ...props }) => (
            <div
              {...props}
              className='scrollbar'
            />
          )}
          renderTrackVertical={({ style, ...props }) => (
            <div
              {...props}
              style={{
                ...style,
                width: '10px',
                bottom: '2px',
                right: '0',
                top: '2px',
                borderRadius: '4px',
              }}
            />
          )}
        >
          {repoStatus && fileChangesArray.map((changes, index) => (
            <FileChangeItem key={index} fileName={changes.file} changeType={changes.changeType} className={styles.fileChangeItem} />
          ))}
        </Scrollbars>
      </div>
    );
  }

  const unstagedFileSectionProps: ChangesSectionProps = {
    sectionBarStyle: styles.unstagedSectionBar,
    barIcon: <DiffModifiedIcon />,
    sectionTitle: `Unstaged Files (${repoStatus?.unstagedFiles.length || 0})`,
    actionButtons: [< StageAllButton repoPath={repoPath} />],
    fileChangesArray: repoStatus?.unstagedFiles ?? [],
  }

  const stagedFileSectionProps: ChangesSectionProps = {
    sectionBarStyle: styles.stagedSectionBar,
    barIcon: <CheckboxIcon />,
    sectionTitle: `Staged Files (${repoStatus?.stagedFiles.length || 0})`,
    actionButtons: [<UnstageAllButton repoPath={repoPath} />],
    fileChangesArray: repoStatus?.stagedFiles ?? [],
  }

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <ChangesSection {...unstagedFileSectionProps} />
      <ChangesSection {...stagedFileSectionProps} />
    </div >
  );
};

export default LocalChanges;
