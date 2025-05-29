import styles from './LocalChanges.module.css';
import { useEffect, useRef } from "react";
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
    currentAppTab,
    repoInfo,
    repoStatus,
    inChangesTab, setInChangesTab,
    statusEvent, headEvent,
    isUnstagedLoading,
    isStagedLoading,
    isStashLoading,
    getRepoStatus,
    getStashedChanges
  } = useMainContext();

  // Listens to repository stauts changes and gets current status
  //TODO: MAYBE STASHED CHANGES IS NOT GETTING UPDATED
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!repoInfo) return;

    if (import.meta.env.DEV && hasLoaded.current) return;

    if (import.meta.env.DEV) {
      hasLoaded.current = true;
    }

    const infoGatherFunctions = () => {
      console.log("infoGatherFunctions");
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

      {/*TODO: THEY DONT LISTEN TO CAHNGES IN THE WI OR INDEX, OR IT DOES AT FIEST BUT JUST ONCE*/}
      <ChangesSection {...unstagedFileSectionProps} />
      <ChangesSection {...stagedFileSectionProps} />

      <StashesSection isLoading={isStashLoading} />
    </div >
  );
};

export default LocalChanges;
