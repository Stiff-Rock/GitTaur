import React, { useState, useEffect } from 'react';
import { useRepo } from '../../../context/RepoContext';
import styles from './MainContainer.module.css'
import { Scrollbars } from 'react-custom-scrollbars-2';

const CommitHistory: React.FC = () => {
  const { repoInfo } = useRepo();
  const [commitNames, setCommitNames] = useState<string[]>([]);

  useEffect(() => {
    if (repoInfo) {
      const commitSubjects = repoInfo.commits.map((commit) => commit.subject);
      setCommitNames(commitSubjects);
    }
  }, [repoInfo])

  return (
    <Scrollbars
      autoHide
      autoHideTimeout={500}
      autoHideDuration={300}
      className={styles.scrollContainer}
    >
      <div className={`${styles.container}`}>
        {commitNames.length > 0 ? (
          commitNames.map((subject, index) => (
            <span key={index}>{"- " + subject}</span>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>No commits available</p>
        )
        }
      </div >
    </Scrollbars>
  );
};

export default CommitHistory;
