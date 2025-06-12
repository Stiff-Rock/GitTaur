import styles from './CommitInfoSidebar.module.css';
import React from 'react';
import { useMainContext } from '../../../../context/MainContext';
import CopyShaButton from './CopyShaButton';
import UserAvatar from './UserAvatar';
import FileChangeItem from '../../../Common/FileItems/FileChangeItem';
import { useAppContext } from '../../../../context/AppContext';
import ScrollBar from '../../../Common/ScrollBar/ScrollBar';
import { formatTimestamp } from '../../../../utils/dateParser';

const CommitInfoSidebar: React.FC = () => {
  const { config } = useAppContext();
  const { currentAppTab, commitInfo, repoHistory, setSelectedCommit, setCommitInfo, scrollToCommit } = useMainContext();

  const goToParent = (sha: string) => {
    if (!repoHistory) return;

    const commit = repoHistory.commitHistoryMap.get(sha);
    if (!commit) {
      console.error("Could not find commit by the following sha: ", sha);
      return;
    }

    setSelectedCommit(commit.id);
    setCommitInfo(commit);
    scrollToCommit(commit.id);
  }

  return (
    <div className={`${styles.infoSidebar} ${currentAppTab === "commit-history" ? '' : 'inactive'}`}>
      {commitInfo ? (
        <ScrollBar containerHeight={100} autoHide={true} offset={0}>
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
                <span className={styles.value}>{formatTimestamp(config?.dateFormat || "", commitInfo.author.timestamp)}</span>
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
                  <span className={styles.value}>{commitInfo.id}</span>
                </div>
                <CopyShaButton sha={commitInfo.id} />
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
        </ScrollBar>
      ) : (
        <span>No commit info available</span>
      )
      }
    </div >
  );
};

export default CommitInfoSidebar;
