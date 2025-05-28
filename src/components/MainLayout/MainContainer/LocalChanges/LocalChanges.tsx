import styles from './LocalChanges.module.css';
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './ActionButtons/StageAllButton';
import UnstageAllButton from './ActionButtons/UnstageAllButton';
import ChangesSection, { ChangesSectionProps } from './ChangesSection/ChangesSection';
import StashesSection from './StashesSection/StashesSection';

//TODO: STASH AND POP

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
    inChangesTab, setInChangesTab,
    setRepoStashes,
    statusEvent, headEvent
  } = useMainContext();

  const { setNotification } = useAppContext();

  const [isUnstagedLoading, setIsUnstageLoading] = useState(false);
  const [isStagedLoading, setIsStageLoading] = useState(false);
  const [isStashLoading, setIsStashLoading] = useState(false);

  // This ref is used to ensure that no other operation that might change status executes while another is runnning
  const statusUpdatePromiseRef = useRef<Promise<any> | null>(null);

  const getRepoStatus = () => {
    statusUpdatePromiseRef.current = invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch(e => {
        console.error(e);
        setNotification(e);
      })
  }

  const getStashedChanges = () => {
    statusUpdatePromiseRef.current = invoke<Stash[]>("get_stashed_changes", { repoPath })
      .then(setRepoStashes)
      .catch(e => {
        console.error(e);
        setNotification(e);
      }).finally(() => setIsStashLoading(false));
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

    statusUpdatePromiseRef.current = invoke("add_to_staging_area", { repoPath, files }).catch((e) => {
      const msg = `Error staging files - ${e}`
      console.error(msg);
      setNotification(msg);
    }).finally(() => setIsStageLoading(false));
  }

  const removeFromStagingArea = async (files: string[]) => {
    if (statusUpdatePromiseRef.current) {
      await statusUpdatePromiseRef.current.catch(() => { });
    }
    setIsUnstageLoading(true);

    setSelectedFiles((prev => {
      return prev.filter(f1 => !files.some(f2 => f1.fileName === f2));
    }))

    statusUpdatePromiseRef.current = invoke("remove_from_staging_area", { repoPath, files }).catch((e) => {
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

    statusUpdatePromiseRef.current = invoke("discard_changes", { repoPath, files }).catch((e) => {
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

    const infoGatherFunctions = () => {
      getRepoStatus();
      getStashedChanges();
    }

    const statusUnlistenPromise = listen<string>(statusEvent, infoGatherFunctions);
    const headUnlistenPromise = listen<string>(headEvent, infoGatherFunctions);

    infoGatherFunctions();

    return () => {
      statusUnlistenPromise.then(unlisten => unlisten());
      headUnlistenPromise.then(unlisten => unlisten());
    };
  }, [repoInfo]);

  const stagedFileSectionProps: ChangesSectionProps = {
    status: "staged",
    barIcon: <CheckboxIcon />,
    sectionTitle: 'Staged Files',
    sectionFileCount: `(${repoStatus?.stagedFiles.length || 0})`,
    actionButtons: [<UnstageAllButton key={'unstageAll'} removeFromStagingArea={removeFromStagingArea} />],
    fileChangesArray: repoStatus?.stagedFiles ?? [],
    selectedFiles,
    setSelectedFiles,
    isLoading: isStagedLoading,
    stagingAreaUpdate: removeFromStagingArea,
    discardChanges
  }

  const unstagedFileSectionProps: ChangesSectionProps = {
    status: "unstaged",
    barIcon: <DiffModifiedIcon />,
    sectionTitle: 'Unstaged Files',
    sectionFileCount: `(${repoStatus?.unstagedFiles.length || 0})`,
    actionButtons: [<StageAllButton key={'stageAll'} addToStagingArea={addToStagingArea} />],
    fileChangesArray: repoStatus?.unstagedFiles ?? [],
    selectedFiles,
    setSelectedFiles,
    isLoading: isUnstagedLoading,
    stagingAreaUpdate: addToStagingArea,
    discardChanges
  }

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div className={styles.changesTabs}>
        <button
          className={`appButton ${styles.tabButton} ${inChangesTab ? styles.activeTab : ''}`}
          onClick={() => setInChangesTab(true)}
        >
          Changes
        </button>
        <div className={styles.buttonSeparator} />
        <button
          className={`appButton ${styles.tabButton} ${!inChangesTab ? styles.activeTab : ''}`}
          onClick={() => setInChangesTab(false)}
        >
          Stashes
        </button>
      </div>

      <ChangesSection {...unstagedFileSectionProps} />
      <ChangesSection {...stagedFileSectionProps} />

      <StashesSection isLoading={isStashLoading} />
    </div >
  );
};

export default LocalChanges;
