import React, { useEffect, useState } from 'react';
import styles from './CommitInfoSidebar.module.css';
import { useMainContext } from '../../../../context/MainContext';
import CopyShaButton from './CopyShaButton';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { invoke } from '@tauri-apps/api/core';
import { DashIcon, PlusIcon, DiffIcon } from '@primer/octicons-react'
import { useAppContext } from '../../../../context/AppContext';
import md5 from "md5";

const CommitInfoSidebar: React.FC = () => {
  const { workspace } = useAppContext();
  const { commitInfo, selectedCommit, repoInfo, setSelectedCommit, setCommitInfo, scrollToCommit } = useMainContext();

  const [changes, setChanges] = useState<FileChange[]>();
  const [pfpUrl, setPfpUrl] = useState<string>("");

  const goToParent = (sha: string) => {
    if (!repoInfo) return;

    const commit = repoInfo.commit_history[sha];
    if (!commit) {
      console.error("Could not find commit by the following sha: ", sha);
      return;
    }

    setSelectedCommit(commit.sha);
    setCommitInfo(commit);
    scrollToCommit();
  }

  const fetchChanges = async () => {
    try {
      if (workspace?.activeTab && selectedCommit) {
        invoke<FileChange[]>("get_commit_changes", {
          repoPath: workspace.activeTab,
          sha: selectedCommit
        }).then(changes => {
          setChanges(changes);
        });
      }
    } catch (error) {
      console.error("Error fetching commit changes:", error);
      setChanges([]);
    }
  };

  const getGravatarUrl = (email: string, size: number, defaultImage: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = md5(trimmedEmail);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
  };

  useEffect(() => {
    if (!commitInfo) return;
    setPfpUrl(getGravatarUrl(commitInfo.email, 50, "retro"));
    fetchChanges();
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
            <div className={styles.authorContainer}>
              {pfpUrl ? (
                <img src={pfpUrl} alt="Profile Picture" />
              ) : (
                <img src='../../../../../src/assets/pfp.svg' alt="Default Profile Picture" />
              )}
              <div className={styles.authorInfo}>
                <span>{commitInfo.author}</span>
                <span>{commitInfo.email && commitInfo.email.includes(".github.com") ? "From GitHub.com" : commitInfo.email}</span>
              </div>
            </div>

            <hr />

            <span className={styles.title}>Commit Information</span>
            <div className={styles.commitContainer}>
              <div className={styles.commitInfoField}>
                <span className={styles.label}>DATE:</span>
                <span className={styles.value}>{commitInfo.commit_date}</span>
              </div>

              <div className={styles.commitInfoField}>
                <span className={styles.label}>PARENTS:</span>
                {commitInfo.parents.map((parent, index) => (
                  <a onClick={() => goToParent(parent)} key={index} className={styles.value}>{parent.slice(0, 7)}</a>
                ))}
              </div>

              <div className={styles.shaField} >
                <div className={styles.commitInfoField}>
                  <span className={styles.label}>SHA:</span>
                  <span className={styles.value}>{commitInfo.sha}</span>
                </div>
                <CopyShaButton sha={commitInfo.sha} />
              </div>

              <div className={styles.commitInfoField}>
                <span className={styles.label}>SUBJECT:</span>
                <span className={styles.value}>{commitInfo.subject}</span>
              </div>

              {commitInfo.body &&
                <div className={styles.commitInfoField}>
                  <span className={styles.label}>Body:</span>
                  <span className={styles.value}>{commitInfo.body}</span>
                </div>
              }
            </div>

            <hr />

            <span className={styles.title}>Changes</span>
            <div className={styles.commitContainer}>
              {changes && changes.length > 0 ? (
                changes.map((change, index) => (
                  <div key={index} className={styles.changeItem}>
                    <span className={styles.changeType}>
                      {change.change_type.includes("Modified") && <DiffIcon className={styles.diffIcon} />}
                      {change.change_type.includes("Added") && <PlusIcon className={styles.plusIcon} />}
                      {change.change_type.includes("Deleted") && <DashIcon className={styles.deletedIcon} />}
                    </span>
                    <span className={styles.value}>{change.file}</span>
                  </div>
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
