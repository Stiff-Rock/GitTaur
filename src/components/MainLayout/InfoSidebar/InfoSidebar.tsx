import React from 'react';
import styles from './InfoSidebar.module.css';
import { useAppContext } from '../../../context/AppContext';

const InfoSidebar: React.FC = () => {
  const { commitInfo } = useAppContext();

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

