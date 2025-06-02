import styles from './LocalChanges.module.css';
import { useEffect, } from "react";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";
import { DiffModifiedIcon, CheckboxIcon } from '@primer/octicons-react'
import StageAllButton from './ActionButtons/StageAllButton';
import UnstageAllButton from './ActionButtons/UnstageAllButton';
import ChangesSection, { ChangesSectionProps } from './ChangesSection/ChangesSection';
import StashesSection from './StashesSection/StashesSection';

export interface FileItem {
  fileName: string;
  changeType: ChangeType;
  status: FileStatusState;
}

const LocalChanges: React.FC = () => {
  const {
    currentAppTab,
    repoStatus,
    inChangesTab, setInChangesTab,
    statusEvent, headEvent,
    isUnstagedLoading,
    isStagedLoading,
    isStashLoading,
    getRepoStatus,
    getStashedChanges
  } = useMainContext();

  // Starts listening to repository stauts and head changes and gets initial information about the repository
  useEffect(() => {
    const infoGatherFunctions = () => {
      getRepoStatus();
      getStashedChanges();
    }
    infoGatherFunctions();

    const statusUnlisten = listen<string>(statusEvent, infoGatherFunctions);
    const headUnlisten = listen<string>(headEvent, infoGatherFunctions);

    return () => {
      statusUnlisten.then((unlisten) => unlisten());
      headUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  const stagedFileSectionProps: ChangesSectionProps = {
    status: "staged",
    barIcon: <CheckboxIcon />,
    sectionTitle: 'Staged Files',
    sectionFileCount: `(${repoStatus?.stagedFiles.length || 0})`,
    actionButtons: [<UnstageAllButton key={'unstageAll'} />],
    fileChangesArray: repoStatus?.stagedFiles ?? [],
    isLoading: isStagedLoading,
  }

  const unstagedFileSectionProps: ChangesSectionProps = {
    status: "unstaged",
    barIcon: <DiffModifiedIcon />,
    sectionTitle: 'Unstaged Files',
    sectionFileCount: `(${repoStatus?.unstagedFiles.length || 0})`,
    actionButtons: [<StageAllButton key={'stageAll'} />],
    fileChangesArray: repoStatus?.unstagedFiles ?? [],
    isLoading: isUnstagedLoading,
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
