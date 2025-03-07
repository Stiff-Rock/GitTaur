import React from 'react';
import styles from './ActionSidebar.module.css';
import Accordion from '../../Common/Accordion/Accordion';
import { GoTag, GoCloud, GoDeviceDesktop } from "react-icons/go";
import AppTabs from './AppTabs';
import { useAppContext } from '../../../context/AppContext';

const ActionsSidebar: React.FC = () => {
  const { repoInfo } = useAppContext();

  return (
    <div className={`${styles.actionSidebar}`}>
      <AppTabs />

      <Accordion title="Local" icon={<GoDeviceDesktop />} >
        {repoInfo &&
          <ul>
            {repoInfo.local_branches.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        }
      </Accordion>

      <Accordion title="Remote" icon={<GoCloud />}>
        {repoInfo &&
          <ul>
            {repoInfo.remotes.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        }
      </Accordion>

      <Accordion title="Tags" icon={<GoTag />}>
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
