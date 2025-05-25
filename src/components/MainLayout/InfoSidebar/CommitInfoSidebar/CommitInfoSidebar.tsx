import React from 'react';
import styles from './CommitInfoSidebar.module.css';
import { useMainContext } from '../../../../context/MainContext';
import CopyShaButton from './CopyShaButton';
import { Scrollbars } from 'react-custom-scrollbars-2';
import UserAvatar from './UserAvatar';
import FileChangeItem from '../../../Common/FileItems/FileChangeItem';
import { useAppContext } from '../../../../context/AppContext';

const CommitInfoSidebar: React.FC = () => {
  const { config } = useAppContext();
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

  const formatTimestamp = (timestamp: number): string => {
    if (!config) return "Error loading date format";

    const date = new Date(timestamp * 1000);

    // Define format tokens map
    const formatTokens: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'YY': date.getFullYear().toString().slice(2),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'M': String(date.getMonth() + 1),
      'DD': String(date.getDate()).padStart(2, '0'),
      'D': String(date.getDate()),
      'HH': String(date.getHours()).padStart(2, '0'),
      'H': String(date.getHours()),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'm': String(date.getMinutes()),
      'ss': String(date.getSeconds()).padStart(2, '0'),
      's': String(date.getSeconds()),
      'ddd': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      'MMMM': ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][date.getMonth()]
    };

    // Replace all tokens in the format string
    let formattedDate = config.dateFormat;
    for (const [token, value] of Object.entries(formatTokens)) {
      // Replace all occurrences of the token
      const tokenRegex = new RegExp(token, 'g');
      formattedDate = formattedDate.replace(tokenRegex, value);
    }

    return formattedDate;
  }

  //TODO: AVATARS https://avatars.githubusercontent.com/{matchGithubUser.Groups[2].Value https://www.gravatar.com/avatar/{md5}?d=404
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
