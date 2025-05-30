import styles from '../ActionSidebar.module.css';
import React, { useEffect, useState } from 'react';
import Accordion from '../../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon, GitBranchIcon, DatabaseIcon, FeedTagIcon, PlusIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';
import ActiveIndicator from '../../../Common/ActiveIndicator';
import { useAppContext } from '../../../../context/AppContext';
import LocalBranchElement from './SubElements/LocalBranchElement';
import RemoteAccordion from './SubElements/RemoteAccordion';
import TagElement from './SubElements/TagElement';

//TODO: { CONTEXT MENU ACTIONS:
// branches: checkout, rename, delete, tag & push and rebase???
// tags: delete, opy tag name, copy tag commit msg, push
// }

const InfoAccordions: React.FC = () => {
  const { setActiveModal } = useAppContext();
  const { repoInfo } = useMainContext();

  const [sortedRemotes, setSortedRemotes] = useState<Map<string, string[]>>();

  useEffect(() => {
    if (!repoInfo) return;

    if (repoInfo.remotes) {
      const sortedMap = new Map(
        [...Object.entries(repoInfo.remotes)]
          .sort(([a], [b]) => a.localeCompare(b))
      );
      setSortedRemotes(sortedMap);
    }
  }, [repoInfo])

  return (
    <>
      {/*Local branches*/}
      <Accordion
        containerClassName={styles.accordion}
        title="Local"
        icon={<DeviceDesktopIcon />}
      >
        {repoInfo &&
          <ul>
            {repoInfo.localBranches.map((branchName, index) => (
              <li key={index}>
                <LocalBranchElement branchName={branchName} className={styles.activeIndicator} />
              </li>
            ))}
          </ul>
        }
      </Accordion>

      {/*Remotes and its branches*/}
      <div className={styles.remotesContainer}>
        <Accordion
          containerClassName={`${styles.accordion} ${styles.remotesAccordion}`}
          childrenContainerClassName={styles.remoteEntries}
          title="Remotes"
          icon={<CloudIcon />}
        >
          {repoInfo && (
            <>
              {sortedRemotes && [...sortedRemotes].map(([remoteName, branches], index) => (
                <RemoteAccordion
                  key={index}
                  containerClassName={`${styles.accordion} ${styles.remoteAccordion}`}
                  headerClassName={styles.remoteAccHeader}
                  remoteName={remoteName}
                  branches={branches}
                />
              ))}
            </>
          )}
        </Accordion >
        <button
          className={`actionButton ${styles.remotesButton}`}
          title='Add remote'
          onClick={() => setActiveModal("addRemote")}
        >
          <PlusIcon />
        </button>
      </div >

      {/*Tags*/}
      < Accordion
        containerClassName={styles.accordion}
        title="Tags"
        icon={< TagIcon />}
      >
        {repoInfo &&
          <ul>
            {repoInfo.tags.map((tag, index) => (
              <li key={index}>
                <TagElement tag={tag} />
              </li>
            ))}
          </ul>
        }
      </Accordion >
    </>
  );
};

export default InfoAccordions;
