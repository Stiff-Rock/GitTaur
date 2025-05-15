import React from 'react';
import styles from './CommitInfoSidebar.module.css';
import { useMainContext } from '../../../../context/MainContext';
import CopyShaButton from './CopyShaButton';
import { Scrollbars } from 'react-custom-scrollbars-2';
import UserAvatar from './UserAvatar';
import FileChangeItem from '../../../Common/FileChangeItem/FileChangeItem';

const CommitInfoSidebar: React.FC = () => {
  const { currentAppTab, commitInfo, repoInfo, setSelectedCommit, setCommitInfo, scrollToCommit } = useMainContext();

  const goToParent = (sha: string) => {
    if (!repoInfo) return;

    const commit = repoInfo.commitHistory[sha];
    if (!commit) {
      console.error("Could not find commit by the following sha: ", sha);
      return;
    }

    setSelectedCommit(commit.hash);
    setCommitInfo(commit);
    scrollToCommit();
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  return (
    <div className={`${styles.infoSidebar} ${currentAppTab === "commit-history" ? '' : 'inactive'}`}>
      {commitInfo ? (
        <Scrollbars
          autoHide
          autoHideTimeout={500}
          autoHideDuration={300}
          renderThumbVertical={({ style, ...props }) => (
            <div
              {...props}
              className='scrollbar'
            />
          )}
          renderTrackVertical={({ style, ...props }) => (
            <div
              {...props}
              style={{
                ...style,
                width: '10px',
                bottom: '2px',
                right: '0',
                top: '2px',
                borderRadius: '4px',
              }}
            />
          )}
        >
          <div className={styles.content}>
            <span className={styles.title}>Author</span>

            {/* AUTHOR INFORMATION */}
            <div className={styles.authorContainer}>
              <UserAvatar
                email={commitInfo.author.email}
                name={commitInfo.author.name}
                size={50}
              />
              <div className={styles.authorInfo}>
                <span>{commitInfo.author.name}</span>
                <span>{commitInfo.author.email && commitInfo.author.email.includes(".github.com") ? "From GitHub.com" : commitInfo.author.email}</span>
              </div>
            </div>

            <hr />

            {/* COMMIT INFORMATION */}
            <span className={styles.title}>Commit Information</span>
            <div className={styles.commitContainer}>
              {/* DATE */}
              <div className={styles.commitInfoField}>
                <span className={styles.label}>DATE:</span>
                <span className={styles.value}>{formatTimestamp(commitInfo.author.timestamp)}</span>
              </div>

              {/* PARENTS */}
              {commitInfo.parents.length > 0 &&
                <div className={styles.commitInfoField}>
                  <span className={styles.label}>PARENTS:</span>
                  {commitInfo.parents.map((parent, index) => (
                    <a onClick={() => goToParent(parent)} key={index} className={styles.value}>{parent.slice(0, 7)}</a>
                  ))}
                </div>
              }

              {/* SHA */}
              <div className={styles.shaField} >
                <div className={styles.commitInfoField}>
                  <span className={styles.label}>SHA:</span>
                  <span className={styles.value}>{commitInfo.hash}</span>
                </div>
                <CopyShaButton sha={commitInfo.hash} />
              </div>

              {/* SUBJECT */}
              <div className={styles.commitInfoField}>
                <span className={styles.label}>SUBJECT:</span>
                <span className={styles.value}>{commitInfo.subject}</span>
              </div>

              {/* BODY */}
              {commitInfo.body &&
                <div className={styles.commitInfoField}>
                  <span className={styles.label}>Body:</span>
                  <span className={styles.value}>{commitInfo.body}</span>
                </div>
              }
            </div>

            <hr />

            {/* CHANGES */}
            <span className={styles.title}>Changes</span>
            <div className={styles.commitContainer}>
              {commitInfo.changes && commitInfo.changes.length > 0 ? (
                commitInfo.changes.map((changes, index) => (
                  <FileChangeItem
                    changeType={changes.changeType}
                    fileName={changes.file}
                    key={index}
                  />
                ))
              ) : (
                <span className={styles.value}>No changes</span>
              )}
            </div>
          </div >
        </Scrollbars>
      ) : (
        <span>No commit info available</span>
      )
      }
    </div >
  );
};

export default CommitInfoSidebar;
