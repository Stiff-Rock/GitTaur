import React, { useEffect, useLayoutEffect, useState } from "react";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { useAppContext } from "../../../../context/AppContext.tsx";
import GitGraph from "./GitGraph/Gitgraph.tsx";
import Throbber from "../../../Common/Throbber/Throbber.tsx";

//WARNING: NOT PREPARED TO DISPLAY FETCHED DATA, ONLY LOCAL PULLED DATA
//NOTE: ????????? Cant handle render of big repos

//BUG: ?????? GRAPH DOESNT SHOW WHILE ON DETACHED STATE ON COMMIT BEHIND HEAD
//TODO: HEAD DETACHED INDICATOR
//TODO: Add a visual indicator of unpushed changes
//TODO: CURRENT CHCKOUT POSITION INDICATOR
//TODO: SCROLL TO SELECTED COMMIT

const CommitGraph: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { repoHistory } = useMainContext();

  const { setActiveRepoHistory, config } = useAppContext();

  const [commitLogs, setCommitLogs] = useState<Commit[] | null>(null);

  useLayoutEffect(() => {
    if (!repoHistory) return;

    if (repoHistory) {
      const commitLogs = Object.values(repoHistory);
      setCommitLogs(commitLogs);
    }
  }, [repoHistory]);

  useEffect(() => {
    setActiveRepoHistory(commitLogs);
  }, [isActive, commitLogs]);

  return (
    <>
      {commitLogs && config ? (
        <GitGraph key={config.maxCommits} repoHistory={repoHistory} maxCommits={config.maxCommits} />
      ) : (
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
      )}
    </>
  );
};

export default CommitGraph;
