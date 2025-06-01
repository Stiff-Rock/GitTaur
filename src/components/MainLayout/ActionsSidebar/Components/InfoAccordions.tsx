import styles from '../ActionSidebar.module.css';
import React, { useEffect, useState } from 'react';
import Accordion from '../../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon, PlusIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';
import { useAppContext } from '../../../../context/AppContext';
import LocalBranchElement from './SubElements/LocalBranchElement';
import RemoteAccordion from './SubElements/RemoteAccordion';
import TagElement from './SubElements/TagElement';

const InfoAccordions: React.FC = () => {
  const { setActiveModal } = useAppContext();
  const { repoInfo } = useMainContext();

  const [sortedRemotes, setSortedRemotes] = useState<Map<string, Remote>>();

  useEffect(() => {
    if (!repoInfo) return;

    const sortedMap = new Map(
      [...Object.entries(repoInfo.remotes)]
        .sort(([a], [b]) => a.localeCompare(b))
    );
    setSortedRemotes(sortedMap);
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
              {sortedRemotes && [...sortedRemotes].map(([_, remote], index) => (
                <RemoteAccordion
                  key={index}
                  containerClassName={`${styles.accordion} ${styles.remoteAccordion}`}
                  headerClassName={styles.remoteAccHeader}
                  remote={remote}
                  branches={remote.branches}
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
                <TagElement tagName={tag} />
              </li>
            ))}
          </ul>
        }
      </Accordion >
    </>
  );
};

export default InfoAccordions;
