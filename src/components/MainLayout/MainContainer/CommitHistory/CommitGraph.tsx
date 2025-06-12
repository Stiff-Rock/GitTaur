import styles from "./CommitGraph.module.css";
import { RepoTemplateIcon } from '@primer/octicons-react'
import React, { useLayoutEffect } from "react";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { useAppContext } from "../../../../context/AppContext.tsx";
import GitGraph from "./GitGraph/Gitgraph.tsx";
import Throbber from "../../../Common/Throbber/Throbber.tsx";

//BUG: ?????? GRAPH DOESNT SHOW WHILE ON DETACHED STATE ON COMMIT BEHIND HEAD
//TODO: HEAD DETACHED INDICATOR

const CommitGraph: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { repoHistory } = useMainContext();

  const { setActiveRepoHistory, config } = useAppContext();

  useLayoutEffect(() => {
    if (repoHistory === undefined) return;
    let value = repoHistory === null ? null : [...repoHistory.commitHistoryMap.values()];
    setActiveRepoHistory(value);
  }, [isActive, repoHistory]);

  return (
    repoHistory ? (
      config ? (
        <GitGraph key={config.maxCommits} repoHistory={repoHistory} maxCommits={config.maxCommits} />
      ) : (<span>An error has ocurred loading the git graph: The configuration file is corrupt or missing</span>)
    ) : repoHistory === undefined ? (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "60px"
      }}>
        <Throbber isVisible={true} size="huge" />
        <span>Loading commit history information...</span>
      </div>
    ) : repoHistory === null && (
      <div className={styles.emptyRepoMsgContainer}>
        <span className={styles.emptyRepoMsg}>Empty repository</span>
        <RepoTemplateIcon size={64} />
      </div >
    )
  );
};

export default CommitGraph;
