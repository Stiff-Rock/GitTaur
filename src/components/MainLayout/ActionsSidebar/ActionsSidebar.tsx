import React from 'react';
import styles from './ActionSidebar.module.css';
import Accordion from '../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon } from "@primer/octicons-react";
import AppTabs from './AppTabs';
import { useMainContext } from '../../../context/MainContext';
import ActiveIndicator from '../../Common/ActiveIndicator';
import { GitBranchIcon, DatabaseIcon, FeedTagIcon } from "@primer/octicons-react";

const ActionsSidebar: React.FC = () => {
  const { repoInfo } = useMainContext();

  return (
    <div className={`${styles.actionSidebar}`}>
      <AppTabs />

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


      <Accordion className={styles.accordion} title="Remote" icon={<CloudIcon />}>
        {repoInfo && (
          <ul>
            {repoInfo.remotes.map((item, index) => (
              <li key={index}>
                <div>
                  <DatabaseIcon />
                  {item}
                </div>
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

    </div >
  );
};

export default ActionsSidebar;
