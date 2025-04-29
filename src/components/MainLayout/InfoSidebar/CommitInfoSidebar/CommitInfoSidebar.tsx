import React, { useEffect, useState } from 'react';
import styles from './CommitInfoSidebar.module.css';
import { useMainContext } from '../../../../context/MainContext';
import CopyShaButton from './CopyShaButton';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import md5 from "md5";

const CommitInfoSidebar: React.FC = () => {
  const { commitInfo, selectedCommit, repoInfo, setSelectedCommit, setCommitInfo, scrollToCommit } = useMainContext();

  const [pfpUrl, setPfpUrl] = useState<string>("");

  const goToParent = (sha: string) => {
    if (!repoInfo) return;

    const commit = repoInfo.commit_history[sha];
    if (!commit) {
      console.error("Could not find commit by the following sha: ", sha);
      return;
    }

    setSelectedCommit(commit.hash);
    setCommitInfo(commit);
    scrollToCommit();
  }

  //TODO: MOVE TO BACKEND TO AVOID WARNINGS
  const getGravatarUrl = (email: string, size: number, defaultImage: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = md5(trimmedEmail);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
  };

  useEffect(() => {
    if (!commitInfo) return;
    setPfpUrl(getGravatarUrl(commitInfo.author.email, 50, "retro"));
  }, [selectedCommit])

  //BUG: SCROLLBAR BUG, CANT SCROLL ALL THE WAY DOWN

  return (
    <div className={`${styles.infoSidebar}`}>
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
              {pfpUrl ? (
                <img src={pfpUrl} alt="Profile Picture" />
              ) : (
                <img src='../../../../../src/assets/pfp.svg' alt="Default Profile Picture" />
              )}
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
                <span className={styles.value}>{commitInfo.author.timestamp}</span>
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
                commitInfo.changes.map((changes, index) => {
                  const type = changes.changeType;
                  console.log("TYPE:", type)

                  return (
                    <div key={index} className={styles.changeItem}>
                      <span className={styles.changeType}>
                        {type === "modified" ? (
                          <DiffIcon className={styles.diffIcon} />
                        ) : type === "added" ? (
                          <PlusIcon className={styles.plusIcon} />
                        ) : type === "deleted" ? (
                          <DashIcon className={styles.minusIcon} />
                        ) : (<span>Error</span>)}
                      </span>
                      <span className={styles.value}>{changes.file}</span>
                    </div>
                  );
                })
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
