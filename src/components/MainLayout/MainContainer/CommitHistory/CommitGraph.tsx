import React, { useEffect, useRef, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { Gitgraph } from "@gitgraph/react";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommit, repoInfo } = useMainContext();
  const prevCommitNodeRect = useRef<HTMLElement | null>(null);

  const [commitLogs, setCommitLogs] = useState<CommitLog[] | null>(null);

  useEffect(() => {
    if (!repoInfo) return;

    if (repoInfo.commit_history) {
      setCommitLogs(Object.values(repoInfo.commit_history));
    }
  }, [repoInfo]);

  useEffect(() => {
    //TODO: GET A REFERENCE OF THE UP-MOST PARENT TO SET THE RECT HEIGHT AND WIDTH DYNAMICALLY
    const commitRect = document.getElementById(`rect-${selectedCommit}`);
    if (!commitRect) return;

    if (prevCommitNodeRect.current)
      prevCommitNodeRect.current.setAttribute("class", graphStyles.unselected);

    commitRect.setAttribute("class", graphStyles.selected);
    prevCommitNodeRect.current = commitRect;
  }, [selectedCommit]);

  //TODO: MAKE GRAPH CUSTOMIZATION
  return (
    <Scrollbars
      ref={scrollbarsRef}
      autoHide
      autoHideTimeout={500}
      autoHideDuration={300}
      renderThumbVertical={({ style, ...props }) => (
        <div {...props} className={styles.scrollbar} />
      )}
      renderTrackVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.trackVertical}
          style={{ ...style, width: '10px', right: '2px', borderRadius: '4px' }}
        />
      )}
    >
      <div className={`${styles.container} ${graphStyles.graph}`}>
        {commitLogs ? (
          <Gitgraph>
            {(gitgraph) => {
              gitgraph.clear();
              gitgraph.import(commitLogs);
            }}
          </Gitgraph>
        ) : (
          //TODO: REPLACE WITH LOADING ANIMATION
          <p>Loading repository info...</p>
        )}
      </div>
    </Scrollbars >
  );
};

export default CommitGraph;
