import React, { useLayoutEffect, useState } from "react";
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

//WARNING: THIS GRAPH AND PROPABLY GIT2JSON TOO ARE NOT PREPARED TO DISPLAY FETCHED DATA, ONLY LOCAL PULLED DATA

BranchLabel.paddingX = 6;
BranchLabel.paddingY = 4;
const scale = 0.8;
const font = `normal ${12 * scale}pt CaskaydiaMonoNerdFont`;

const customTemplate: Template = templateExtend(TemplateName.Metro, {
  //TODO: GENERATE COLORSHCEME, LET USER CUSTOMIZE
  colors: ["#1CA085", "#C0392B", "#8E44AD", "#F39C12", "#2980B9"],
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

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, repoInfo, currentAppTab } = useMainContext();

  const [commitLogs, setCommitLogs] = useState<CommitLog[] | null>(null);

  useLayoutEffect(() => {
    if (!repoInfo) return;

    if (repoInfo.commitHistory) {
      const commitLogs = Object.values(repoInfo.commitHistory);
      setCommitLogs(commitLogs);
    }
  }, [repoInfo]);

  //TODO: MAKE GRAPH CUSTOMIZATION
  //TODO: MAKE GRAPHS STRAIGHT
  //TODO: FIX VERTICAL AND HORIZONTAL SCROLLBARS
  //TODO: RECTS HAVE TO FIT ENTERILY AND SELECTED COMMTIS ARE BUGGER SOMEHOW
  return (
    <Scrollbars
      className={currentAppTab === "commit-history" ? '' : 'inactive'}
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
          <GraphProvider key={commitLogs!.length}>
            <Gitgraph options={options} graphCommitOptions={graphCommitOptions}>
              {(gitgraph) => {
                console.log("RE-RENDER")
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
