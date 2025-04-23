import React, { useEffect, useState } from 'react';
import styles from '../ActionSidebar.module.css';
import Accordion from '../../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon } from "@primer/octicons-react";
import { useMainContext } from '../../../../context/MainContext';
import ActiveIndicator from '../../../Common/ActiveIndicator';
import { GitBranchIcon, DatabaseIcon, FeedTagIcon } from "@primer/octicons-react";

const InfoAccordions: React.FC = () => {
  const { repoInfo } = useMainContext();

  const [sortedRemotes, setSortedRemotes] = useState<Map<string, string[]>>();

  //TODO: REMOTES ACCORDION BUGGED AS FUCK
  useEffect(() => {
    if (!repoInfo) return;

    if (repoInfo.remotes) {
      const sortedMap = new Map(
        [...Object.entries(repoInfo.remotes)]
          .sort(([a], [b]) => a.localeCompare(b))
      );
      setSortedRemotes(sortedMap);
    }

    console.log("REPO:", repoInfo)
    console.log("REMOTES:", repoInfo.remotes)
    Object.entries(repoInfo.remotes).forEach(value => {
      console.log("BRANCH:", value)
    });

  }, [repoInfo])

  return (
    <>
      <Accordion className={styles.accordion} title="Local" icon={<DeviceDesktopIcon />} >
        {repoInfo &&
          <ul>
            {repoInfo.local_branches.map((item, index) => (
              <li key={index}>
                <div>
                  <GitBranchIcon />
                  {item}
                  <ActiveIndicator
                    style={repoInfo.current_branch !== item ? {} : { display: 'none' }}
                    className={`${styles.activeIndicator}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        }
      </Accordion>


      <Accordion className={styles.accordion} title="Remotes" icon={<CloudIcon />}>
        {repoInfo && (
          <ul>
            {sortedRemotes && [...sortedRemotes].map(([remoteName, branches], index) => (
              <li key={index}>
                <Accordion className={styles.accordion} title={remoteName} icon={<DatabaseIcon />}>
                  <ul>
                    {branches.map((branch, branchIndex) => (
                      <li key={`${remoteName}-${branch}-${branchIndex}`}>
                        {branch}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              </li>
            ))}
          </ul>
        )}
      </Accordion>


      <Accordion className={styles.accordion} title="Tags" icon={<TagIcon />}>
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
