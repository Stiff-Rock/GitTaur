import React, { useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { GraphProvider } from "../../../../context/GraphContext.tsx";
import { BranchLabel } from "../../../Gitgraph/BranchLabel.tsx";
import { Gitgraph, templateExtend, TemplateName } from "./../../../Gitgraph";
import { MergeStyle, Template } from "@gitgraph/core/lib/template";
import { GitgraphOptions } from "@gitgraph/core";
import { GraphCommitOptions } from "../../../Gitgraph/Commit.tsx";

BranchLabel.paddingX = 6;
BranchLabel.paddingY = 4;

const font = "normal 12pt CaskaydiaMonoNerdFont";

const customTemplate: Template = templateExtend(TemplateName.Metro, {
  colors: ["#1CA085", "#C0392B", "#8E44AD", "#F39C12", "#2980B9"],
  branch: {
    lineWidth: 4,
    spacing: 35,
    mergeStyle: MergeStyle.Straight,
    label: {
      font: font,
    }
  },
  commit: {
    spacing: 40,
    dot: {
      size: 8,
    },
    message: {
      displayAuthor: false,
      displayHash: false,
      font: font,
    },
  },
  tag: {
    font: font,
  }
});

const options: GitgraphOptions = {
  template: customTemplate,
}

const graphCommitOptions: GraphCommitOptions = {
  showMessageBody: false,
}

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, repoInfo } = useMainContext();

  const [commitLogs, setCommitLogs] = useState<CommitLog[] | null>(null);

  useEffect(() => {
    if (!repoInfo) return;

    if (repoInfo.commit_history) {
      const commitLogs = Object.values(repoInfo.commit_history);
      setCommitLogs(commitLogs);
    }
  }, [repoInfo]);

  //TODO: MAKE GRAPH CUSTOMIZATION
  //TODO: MAKE GRAPHS STRAIGHT
  //TODO: FIX VERTICAL AND HORIZONTAL SCROLLBARS
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
          <GraphProvider>
            <Gitgraph options={options} graphCommitOptions={graphCommitOptions}>
              {(gitgraph) => {
                gitgraph.clear();
                gitgraph.import(commitLogs);
              }}
            </Gitgraph>
          </GraphProvider>
        ) : (
          //TODO: REPLACE WITH LOADING ANIMATION
          <p>Loading repository info...</p>
        )}
      </div>
    </Scrollbars >
  );
};

export default CommitGraph;
