import styles from './LocalChanges.module.css';
import { ReactNode, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import FileChangeStatusItem from "../../../Common/FileItems/FileChangeStatusItem";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './ActionButtons/StageAllButton';
import UnstageAllButton from './ActionButtons/UnstageAllButton';
import Throbber from '../../../Common/Throbber/Throbber';
import ScrollBar from '../../../Common/ScrollBar/ScrollBar';

//TODO: STASH, DISCARD AND POP

export interface FileItem {
  fileName: string;
  changeType: ChangeType;
  status: FileStatusState;
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

  // This ref is used to ensure that no other operation that might change status executes while another is runnning
  const statusUpdatePromiseRef = useRef<Promise<any> | null>(null);
  const getRepoStatus = () => {
    statusUpdatePromiseRef.current = invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch(e => setNotification(e))
      .finally(() => 0);
  }

  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const addToStagingArea = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsStageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    invoke("add_to_staging_area", { repoPath, files }).catch((e) => {
      const msg = `Error staging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(() => setIsStageLoading(false));
  }

  //BUG: DOUBLE CLICK STOPPED WORKING
  const removeFromStagingArea = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsUnstageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    invoke("remove_from_staging_area", { repoPath, files }).catch((e) => {
      const msg = `Error unstaging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(() => setIsUnstageLoading(false));
  }

  const discardChanges = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsUnstageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    invoke("discard_changes", { repoPath, files }).catch((e) => {
      console.error("Error discarding changes: ", e);
      setNotification("Error discarding changes: " + e);
    }).finally(() => setIsUnstageLoading(false));
  }

  // Listens to repository stauts changes and gets current status
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!repoInfo) return;

    if (import.meta.env.DEV && hasLoaded.current) return;

    if (import.meta.env.DEV) {
      hasLoaded.current = true;
    }

    const statusUnlistenPromise = listen<string>(statusEvent, getRepoStatus);
    const headUnlistenPromise = listen<string>(headEvent, getRepoStatus);

    invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch((e) => {
        console.error(e);
        setNotification(e);
      });

    return () => {
      statusUnlistenPromise.then(unlisten => unlisten());
      headUnlistenPromise.then(unlisten => unlisten());
    };
  }, [repoInfo]);

  interface ChangesSectionProps {
    status: FileStatusState
    sectionBarStyle: string;
    barIcon: ReactNode;
    sectionTitle: string;
    sectionFileCount: string;
    actionButtons: ReactNode[];
    fileChangesArray: FileChanges[];
    isLoading: boolean;
    stagingAreaUpdate: (files: string[]) => void;
  }

  //TODO: MULTI-SELECTION

  const ChangesSection: React.FC<ChangesSectionProps> = (props) => {
    const {
      status,
      sectionBarStyle,
      barIcon,
      sectionTitle,
      sectionFileCount,
      actionButtons,
      fileChangesArray,
      isLoading,
      stagingAreaUpdate,
    } = props;

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

        <ScrollBar autoHide={true} offset={5}>
          {/*TODO: HIDDEN OVERFLOWING CONTENT*/}
          <div className={styles.sectionContent}>
            {repoStatus && fileChangesArray.map((changes, index) => {
              const file: FileItem = { fileName: changes.file, status, changeType: changes.changeType };
              return (
                <FileChangeStatusItem
                  key={index}
                  file={file}
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

  const stagedFileSectionProps: ChangesSectionProps = {
    status: "staged",
    sectionBarStyle: styles.stagedSectionBar,
    barIcon: <CheckboxIcon />,
    sectionTitle: 'Staged Files',
    sectionFileCount: `(${repoStatus?.stagedFiles.length || 0})`,
    actionButtons: [<UnstageAllButton key={'unstageAll'} removeFromStagingArea={removeFromStagingArea} />],
    fileChangesArray: repoStatus?.stagedFiles ?? [],
    isLoading: isStagedLoading,
    stagingAreaUpdate: removeFromStagingArea,
  }

  const unstagedFileSectionProps: ChangesSectionProps = {
    status: "unstaged",
    sectionBarStyle: styles.unstagedSectionBar,
    barIcon: <DiffModifiedIcon />,
    sectionTitle: 'Unstaged Files',
    sectionFileCount: `(${repoStatus?.unstagedFiles.length || 0})`,
    actionButtons: [<StageAllButton key={'stageAll'} addToStagingArea={addToStagingArea} />],
    fileChangesArray: repoStatus?.unstagedFiles ?? [],
    isLoading: isUnstagedLoading,
    stagingAreaUpdate: addToStagingArea,
  }

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <ChangesSection {...unstagedFileSectionProps} />
      <ChangesSection {...stagedFileSectionProps} />
    </div >
  );
};

export default LocalChanges;
