import React from 'react';
import styles from './InfoSidebar.module.css';
import { useMainContext } from '../../../context/MainContext';

const InfoSidebar: React.FC = () => {
  const { commitInfo } = useMainContext();

  return (
    <div className={`${styles.infoSidebar}`}>
      {commitInfo ? (
        <>
          <span>{commitInfo.author}</span>
          <span>{commitInfo.commit_date}</span>
          <span>{commitInfo.subject}</span>
          {commitInfo.body && <span>{commitInfo.body}</span>}
          <span>{commitInfo.sha}</span>
        </>
      ) : (
        <span>No commit info available</span>
      )}
    </div>
  );
};

export default InfoSidebar;

