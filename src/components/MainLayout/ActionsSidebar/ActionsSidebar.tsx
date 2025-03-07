import React from 'react';
import styles from './ActionSidebar.module.css';
import Accordion from '../../Common/Accordion/Accordion';
import { GoTag, GoCloud, GoDeviceDesktop } from "react-icons/go";
import Tabs from './Tabs';

const ActionsSidebar: React.FC = () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];

  return (
    <div className={`${styles.actionSidebar}`}>
      <Tabs />

      <Accordion title="Local" icon={<GoDeviceDesktop />} >
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Remote" icon={<GoCloud />}>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Tags" icon={<GoTag />}>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Accordion>

    </div >
  );
};

export default ActionsSidebar;
