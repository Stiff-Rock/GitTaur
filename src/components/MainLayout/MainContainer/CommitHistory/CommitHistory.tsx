import React, { useCallback } from 'react';
import styles from '../MainContainer.module.css'
import { Scrollbars } from 'react-custom-scrollbars-2';
import { useMainContext } from '../../../../context/MainContext';
import { Menu } from "@tauri-apps/api/menu";

const CommitHistory: React.FC = () => {

  const { scrollbarsRef, selectedCommitRef, selectedCommit, setSelectedCommit, repoInfo, setCommitInfo } = useMainContext();

  const handleContextMenu = useCallback(async (event: React.MouseEvent) => {
    //TODO: CONTEXT MENU
    event.preventDefault();

    const menu = await Menu.new({
      items: [
        {
          id: "custom-option-1",
          text: "Custom Option 1",
          action: () => {
            console.log("Custom Option 1 clicked");
          },
        },
        {
          id: "custom-option-2",
          text: "Custom Option 2",
          action: () => {
            console.log("Custom Option 2 clicked");
          },
        },
      ],
    });


    await menu.popup({ x: event.clientX, y: event.clientY } as any);
  }, []);

  const showCommit = (commit: CommitNode) => {
    setSelectedCommit(commit.sha);
    setCommitInfo(commit)
  }

  return (
    <Scrollbars
      ref={scrollbarsRef}
      autoHide
      autoHideTimeout={500}
      autoHideDuration={300}
      renderThumbVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.scrollbar}
        />
      )}
      renderTrackVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.trackVertical}
          style={{
            ...style,
            width: '10px',
            right: '2px',
            bottom: '2px',
            top: '2px',
            borderRadius: '4px'
          }}
        />
      )}
    >
      <div className={`${styles.container}`}>
        {repoInfo && Object.values(repoInfo.commit_history).length > 0 ? (
          Object.values(repoInfo.commit_history).map((commit, index) => (
            <span
              ref={commit.sha === selectedCommit ? selectedCommitRef : null}
              className={`${styles.commit} ${selectedCommit === commit.sha ? styles.selected : ''}`}
              onClick={() => showCommit(commit)}
              onContextMenu={handleContextMenu}
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
