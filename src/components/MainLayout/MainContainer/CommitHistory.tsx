import React, { useState, useEffect } from 'react';
import { useRepo } from '../../../context/RepoContext';
import styles from './MainContainer.module.css'

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
  );
};

export default CommitHistory;
