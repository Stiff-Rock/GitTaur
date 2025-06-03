import React, { useEffect, useLayoutEffect, useState } from "react";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { BranchLabel } from "./Gitgraph/BranchLabel.tsx";
import { Gitgraph, templateExtend, TemplateName } from "./Gitgraph";
import { MergeStyle, Template } from "@gitgraph/core/lib/template";
import { GitgraphOptions } from "@gitgraph/core";
import { GraphCommitOptions } from "./Gitgraph/Commit.tsx";
import ScrollBar from "../../../Common/ScrollBar/ScrollBar.tsx";
import { useAppContext } from "../../../../context/AppContext.tsx";

//WARNING: THIS GRAPH AND PROBABLY GIT2JSON TOO ARE NOT PREPARED TO DISPLAY FETCHED DATA, ONLY LOCAL PULLED DATA
//TODO: ADD AUTHOR ICON
//NOTE: Cant handle render of big repos

//BUG: GRAPH DOESNT SHOW WHILE ON DETACHED STATE ON COMMIT BEHIND HEAD
//BUG: TAGS ARE NOT ALWAYS DISPLAYED, SPECIALLY IF BRANCH TIP
//TODO: HEAD DETACHED INDICATOR
//TODO: Add a visual indicator of unpushed changes
//TODO: CURRENT CHCKOUT POSITION INDICATOR
//TODO: SCROLL TO SELECTED COMMIT

BranchLabel.paddingX = 6;
BranchLabel.paddingY = 4;
const scale = 0.8;
const font = `normal ${12 * scale}pt CaskaydiaMonoNerdFont`;

const customTemplate: Template = templateExtend(TemplateName.Metro, {
  colors: ["#1CA085", "#C0392B", "#8E44AD", "#F39C12", "#2980B9", "#F1C40F", "#34495E", "#D35400", "#7F8C8D"],
  branch: {
    lineWidth: 4 * scale,
    spacing: 35 * scale,
    mergeStyle: MergeStyle.Straight,
    label: {
      font: font,
    }
  },
  commit: {
    spacing: 40 * scale,
    dot: {
      size: 8 * scale,
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

const CommitGraph: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { scrollbarRef, commitHistory, currentAppTab } = useMainContext();

  const { setActiveRepoHistory, config } = useAppContext();

  const [commitLogs, setCommitLogs] = useState<CommitLog[] | null>(null);

  useLayoutEffect(() => {
    if (!commitHistory) return;

    if (commitHistory) {
      const commitLogs = Object.values(commitHistory);
      setCommitLogs(commitLogs);
    }
  }, [commitHistory]);

  useEffect(() => {
    setActiveRepoHistory(commitLogs);
  }, [isActive, commitLogs]);

  return (
    <ScrollBar
      containerHeight={100}
      autoHide={true}
      offset={5}
      className={currentAppTab === "commit-history" ? '' : 'inactive'}
      ref={scrollbarRef}
    >
      <div className={`${styles.container} ${graphStyles.graph}`}>
        {commitLogs && config ? (
          <Gitgraph
            key={`${commitLogs.length}-${config.maxCommits}`}
            options={options} graphCommitOptions={graphCommitOptions}
          >
            {(gitgraph) => {
              gitgraph.clear();

              const maxCommits = config.maxCommits;
              let commits = commitLogs;
              if (commits.length > maxCommits) {
                commits = commits.slice(0, maxCommits);
              }
              gitgraph.import(commits);
            }}
          </Gitgraph>
        ) : (
          //TODO: REPLACE WITH LOADING ANIMATION
          <p>Loading repository info...</p>
        )}
      </div>
    </ScrollBar >
  );
};

export default CommitGraph;
