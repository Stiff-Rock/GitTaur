import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Gitgraph, TemplateName } from "@gitgraph/react";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css"
import { useMainContext } from "../../../../context/MainContext.tsx";
import { CommitInfo } from "../../../../types/repoInfo.ts";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommitRef, setSelectedCommit, repoInfo, setCommitInfo } = useMainContext();

  const getTopologicalOrder = (commits: CommitInfo[]): CommitInfo[] => {
    const visited = new Set<string>();
    const order: CommitInfo[] = [];

    const visit = (sha: string) => {
      if (visited.has(sha)) return;
      visited.add(sha);
      const commit = commits.find(c => c.sha === sha);
      commit?.parents.forEach(visit);
      commit && order.push(commit);
    };

    commits.forEach(commit => !visited.has(commit.sha) && visit(commit.sha));
    return order.reverse();
  };

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
      <div className={styles.container}>
        <Gitgraph options={{ template: TemplateName.Metro }}>
          {(gitgraph) => {

            //TODO: DO 
            const master = gitgraph.branch("master");
            master.commit("Initial commit");

            const develop = master.branch("develop");
            develop.commit("Add TypeScript");

            const aFeature = develop.branch("a-feature");
            aFeature
              .commit("Make it work")
              .commit("Make it right")
              .commit("Make it fast");

            develop.merge(aFeature);
            develop.commit("Prepare v1");

            master.merge(develop).tag("v1.0.0");

          }}
        </Gitgraph>
      </div>
    </Scrollbars >
  );
};

export default CommitGraph;
