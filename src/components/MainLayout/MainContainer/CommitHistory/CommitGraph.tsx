import styles from "./CommitGraph.module.css";
import { RepoTemplateIcon } from '@primer/octicons-react'
import React, { useLayoutEffect, useState } from "react";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { useAppContext } from "../../../../context/AppContext.tsx";
import Throbber from "../../../Common/Throbber/Throbber.tsx";
import GitGraph from "./ReactGitGraph/Gitgraph.tsx";

const CommitGraph: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { repoHistory, setSelectedCommit, setCommitInfo, scrollToCommit, currentAppTab } = useMainContext();

  const { setActiveRepoHistory, config } = useAppContext();

  const [detachedHeadOrigin, setDetachedHeadOrigin] = useState("");

  useLayoutEffect(() => {
    if (repoHistory === undefined) return;
    let value = repoHistory === null ? null : [...repoHistory.commitHistoryMap.values()];
    setActiveRepoHistory(value);

    if (repoHistory && repoHistory.headIsDetached) {
      const sha = [...repoHistory.commitHistoryMap.values()].reverse().find(c => c.isFromMainBranch)?.id;
      if (sha) setDetachedHeadOrigin(sha);
    }
  }, [isActive, repoHistory]);

  const goToParent = (sha: string) => {
    if (!repoHistory) return;

    const commit = repoHistory.commitHistoryMap.get(sha);
    if (!commit) {
      console.error("Could not find commit by the following sha: ", sha);
      return;
    }

    setSelectedCommit(commit.id);
    setCommitInfo(commit);
    scrollToCommit(commit.id);
  }

  return (
    <div className={currentAppTab === "commit-history" ? '' : 'inactive'} style={{ width: '100%', height: '100%' }}>
      {repoHistory ? (
        config ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <GitGraph key={config.maxCommits} repoHistory={repoHistory} maxCommits={config.maxCommits} />

            {repoHistory?.headIsDetached &&
              <span className={styles.detachedIndicator}>
                Head detached from&nbsp;
                <a onClick={() => goToParent(detachedHeadOrigin)}>
                  {detachedHeadOrigin.slice(0, 7)}
                </a>
              </span>}
          </div>
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
      )}
    </div>
  );
};

export default CommitGraph;
