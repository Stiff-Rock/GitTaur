import React from 'react';
import styles from './ActionSidebar.module.css';
import Accordion from '../../Common/Accordion/Accordion';

const ActionsSidebar: React.FC = () => {
  const localItems = ['Item 1', 'Item 2', 'Item 3'];
  const remoteItems = ['Branch A', 'Branch B'];

  return (
    <div className={`${styles.actionSidebar}`}>

      <div className={`${styles.actionsContainer}`}>
        <span>Repository</span>
        <div className={`${styles.actionButtons}`}>
          <button />
          <button />
          <button />
        </div>
      </div>

      <Accordion title="Local" >
        <ul>
          {localItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Remote" >
        <ul>
          {remoteItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Accordion>

    </div >
  );
};

export default ActionsSidebar;
