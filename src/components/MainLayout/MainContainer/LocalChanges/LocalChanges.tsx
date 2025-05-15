import styles from './LocalChanges.module.css';
import { ReactNode, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import FileChangeItem from "../../../Common/FileChangeItem/FileChangeItem";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './StageAllButton';
import UnstageAllButton from './UnstageAllButton';
import Scrollbars from 'react-custom-scrollbars-2';
import Throbber from '../../../Common/Throbber/Throbber';

export interface ActionButtonProps {
  onActionStart: () => void;
  onActionEnd: () => void;
  statusUpdatePromise: React.RefObject<Promise<any> | null>;
}

const LocalChanges: React.FC = () => {
  const {
    repoPath,
    currentAppTab,
    repoInfo,
    repoStatus, setRepoStatus,
    statusEvent, headEvent
  } = useMainContext();

  const { setNotification } = useAppContext();

  const [isUnstagedLoading, setIsUnstageLoading] = useState(false);
  const [isStagedLoading, setIsStageLoading] = useState(false);

  const statusUpdatePromiseRef = useRef<Promise<any> | null>(null);

  const getRepoStatus = () => {
    statusUpdatePromiseRef.current = invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch(e => setNotification(e))
      .finally(() => 0);
  }

  //TODO: DELETE REF ON RELEASE
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!repoInfo || hasLoaded.current) return;
    hasLoaded.current = true;

    const statusUnlistenPromise = listen<string>(statusEvent, getRepoStatus);
    const headUnlistenPromise = listen<string>(headEvent, getRepoStatus);

    invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch((e) => { console.error(e); setNotification(e); })

    return () => {
      statusUnlistenPromise.then(unlisten => unlisten());
      headUnlistenPromise.then(unlisten => unlisten());
    };
  }, [repoInfo]);

  interface ChangesSectionProps {
    sectionBarStyle: string;
    barIcon: ReactNode;
    sectionTitle: string;
    sectionFileCount: string;
    actionButtons: ReactNode[];
    fileChangesArray: FileChanges[];
    isLoading: boolean;
  }

  const ChangesSection: React.FC<ChangesSectionProps> = (props) => {
    const { sectionBarStyle, barIcon, sectionTitle, sectionFileCount, actionButtons, fileChangesArray, isLoading } = props;

    return (
      <div className={`${styles.section}`}>
        <div className={`${styles.sectionBar} ${sectionBarStyle}`}>
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

  const unstagedActionButtonProps: ActionButtonProps = {
    onActionStart: () => setIsUnstageLoading(true),
    onActionEnd: () => setIsUnstageLoading(false),
    statusUpdatePromise: statusUpdatePromiseRef,
  }

  const unstagedFileSectionProps: ChangesSectionProps = {
    sectionBarStyle: styles.stagedSectionBar,
    barIcon: <CheckboxIcon />,
    sectionTitle: 'Staged Files',
    sectionFileCount: `(${repoStatus?.stagedFiles.length || 0})`,
    actionButtons: [<UnstageAllButton key={'unstageAll'} {...unstagedActionButtonProps} />],
    fileChangesArray: repoStatus?.stagedFiles ?? [],
    isLoading: isUnstagedLoading,
  }

  const stagedActionButtonProps: ActionButtonProps = {
    onActionStart: () => setIsStageLoading(true),
    onActionEnd: () => setIsStageLoading(false),
    statusUpdatePromise: statusUpdatePromiseRef,
  }

  const stagedFileSectionProps: ChangesSectionProps = {
    sectionBarStyle: styles.unstagedSectionBar,
    barIcon: <DiffModifiedIcon />,
    sectionTitle: 'Unstaged Files',
    sectionFileCount: `(${repoStatus?.unstagedFiles.length || 0})`,
    actionButtons: [<StageAllButton key={'stageAll'} {...stagedActionButtonProps} />],
    fileChangesArray: repoStatus?.unstagedFiles ?? [],
    isLoading: isStagedLoading,
  }

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <ChangesSection {...stagedFileSectionProps} />
      <ChangesSection {...unstagedFileSectionProps} />
    </div >
  );
};

export default LocalChanges;
