import React, { useState, useEffect } from 'react';
import styles from './MainContainer.module.css'
import { Scrollbars } from 'react-custom-scrollbars-2';
import { CommitInfo } from '../../../types/repoInfo';
import { useMainContext } from '../../../context/MainContext';

const CommitHistory: React.FC = () => {
  const { repoInfo, setCommitInfo } = useMainContext();
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  useEffect(() => {
    if (repoInfo) {
      setCommits(repoInfo.commits);
    }
  }, [repoInfo])

  function showCommit(commit: CommitInfo) {
    setSelectedCommit(commit.sha);
    setCommitInfo(commit)
  }

  return (
    <Scrollbars
      autoHide
      autoHideTimeout={500}
      autoHideDuration={300}
      className={styles.scrollContainer}
    >
      <div className={`${styles.container}`}>
        {commits.length > 0 ? (
          commits.map((commit, index) => (
            <span
              className={`${styles.commit} ${selectedCommit === commit.sha ? styles.selected : ''}`}
              onClick={() => showCommit(commit)}
              key={index}
            >
              {"- " + commit.subject}
            </span>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>No commits available</p>
        )}
      </div >
    </Scrollbars >
  );
};

export default CommitHistory;
