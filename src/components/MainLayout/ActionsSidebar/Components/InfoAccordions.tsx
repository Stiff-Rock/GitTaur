import React, { useEffect, useState } from 'react';
import styles from '../ActionSidebar.module.css';
import Accordion from '../../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon, GitBranchIcon, DatabaseIcon, FeedTagIcon, PlusIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';
import ActiveIndicator from '../../../Common/ActiveIndicator';

const InfoAccordions: React.FC = () => {
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
      <Accordion containerClassName={styles.accordion} title="Local" icon={<DeviceDesktopIcon />} >
        {repoInfo &&
          <ul>
            {repoInfo.localBranches.map((item, index) => (
              <li key={index}>
                <div>
                  <GitBranchIcon />
                  {item}
                  <ActiveIndicator
                    style={repoInfo.currentBranch === item ? {} : { display: 'none' }}
                    className={`${styles.activeIndicator}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        }
      </Accordion>

      <div>
        <Accordion containerClassName={styles.accordion} childrenContainerClassName={styles.remoteEntries} title="Remotes" icon={<CloudIcon />}>
          {repoInfo && (
            <>
              {sortedRemotes && [...sortedRemotes].map(([remoteName, branches], index) => (
                <Accordion
                  key={index}
                  containerClassName={`${styles.accordion} ${styles.remoteAccordion}`}
                  headerClassName={styles.remoteAccHeader}
                  title={remoteName}
                  icon={<DatabaseIcon />}
                >
                  <ul>
                    {branches.map((branch, branchIndex) => (
                      <li key={`${remoteName}-${branch}-${branchIndex}`}>
                        <GitBranchIcon />
                        {branch}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              ))}
            </>
          )}
        </Accordion >
        {/*TODO: ADD BUTTON TO ADD REMOTE*/}
        <div style={{ display: 'none' }}>
          <PlusIcon />
        </div>
      </div>


      <Accordion containerClassName={styles.accordion} title="Tags" icon={<TagIcon />}>
        {repoInfo &&
          <ul>
            {repoInfo.tags.map((item, index) => (
              <li key={index}>
                <div>
                  <FeedTagIcon />
                  {item}
                </div>
              </li>
            ))}
          </ul>
        }
      </Accordion>

    </>
  );
};

export default InfoAccordions;
