import React, { useEffect, useRef } from "react";
import { Branch, Gitgraph, templateExtend, TemplateName } from "@gitgraph/react";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { ReactSvgElement } from "@gitgraph/react/lib/types";
import type { Commit, GitgraphCommitOptions } from "@gitgraph/core";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommit, setSelectedCommit, setSelectedCommitNode, selectedCommitNode, repoInfo, setCommitInfo } = useMainContext();
  const prevCommitNodeRect = useRef<HTMLElement | null>(null);

  const onCommitClicked = (commit: Commit<ReactSvgElement>) => {
    if (repoInfo && selectedCommitNode !== commit) {
      setSelectedCommitNode(commit);
      setSelectedCommit(commit.hash);
      setCommitInfo(repoInfo.commit_history[commit.hash]);
    }
  };

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
        {repoInfo ? (
          <Gitgraph options={{
            template: templateExtend(TemplateName.Metro, {
              colors: ["#1CA085", "#C0392B", "#8E44AD", "#F39C12", "#2980B9"],
              branch: {
                lineWidth: 4,
                spacing: 35,
              },
              commit: {
                spacing: 50,
                dot: {
                  size: 12,
                },
                message: {
                  displayAuthor: false,
                  displayHash: false,
                },
              },
            }),
          }}>
            {(gitgraph) => {
              gitgraph.clear();
              gitgraph.import(repoInfo.commit_history);
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
