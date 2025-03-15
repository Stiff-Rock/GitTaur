import React from 'react';
import styles from './ActionSidebar.module.css';
import Accordion from '../../Common/Accordion/Accordion';
import { CloudIcon, DeviceDesktopIcon, TagIcon } from "@primer/octicons-react";
import AppTabs from './AppTabs';
import { useMainContext } from '../../../context/MainContext';

const ActionsSidebar: React.FC = () => {
  const { repoInfo } = useMainContext();

  return (
    <div className={`${styles.actionSidebar}`}>
      <AppTabs />

      <Accordion title="Local" icon={<DeviceDesktopIcon />} >
        {repoInfo &&
          <ul>
            {repoInfo.local_branches.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        }
      </Accordion>

      <Accordion title="Remote" icon={<CloudIcon />}>
        {repoInfo &&
          <ul>
            {repoInfo.remotes.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        }
      </Accordion>

      <Accordion title="Tags" icon={<TagIcon />}>
        {repoInfo &&
          <ul>
            {repoInfo.tags.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        }
      </Accordion>

    </div >
  );
};

export default ActionsSidebar;
