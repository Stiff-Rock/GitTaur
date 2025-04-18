import React from "react";
import { Branch, Gitgraph, TemplateName } from "@gitgraph/react";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";
import { ReactSvgElement } from "@gitgraph/react/lib/types";
import type { Commit } from "@gitgraph/core";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommitRef, setSelectedCommit, repoInfo, setCommitInfo } = useMainContext();

  const onCommitClicked = (commit: Commit<ReactSvgElement>) => {
    if (selectedCommitRef !== commit) {
      setSelectedCommit(commit);
      setCommitInfo();
    }
  }

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
      <div className={styles.container}>
        {repoInfo ? (
          <Gitgraph options={{ template: TemplateName.Metro }}>
            {(gitgraph) => {
              gitgraph.clear();

              const commitHistory = repoInfo.commit_history;
              const commits = Object.values(commitHistory);
              const branchMap = new Map<string, Branch>;

              let currentBranch: Branch;

              for (const commit of commits) {
                if (commit.parents.length > 1) {
                  const mergeRecieverBranch = branchMap.get(commit.branch);
                  const toBeMergedBranch = commitHistory[commit.parents[1]].branch;
                  if (mergeRecieverBranch !== undefined) {
                    console.log("MERGE " + toBeMergedBranch + " INTO " + mergeRecieverBranch.name);
                    mergeRecieverBranch.merge({
                      branch: toBeMergedBranch,
                      commitOptions: { author: commit.author, subject: commit.subject, hash: commit.sha }
                    });
                  } else {
                    console.error("TARGET BRANCH UNDEFINED")
                    console.error("TARGETBRANCH: ", mergeRecieverBranch);
                    console.error("SOURCEBRANCH: ", toBeMergedBranch);
                    console.error("COMMITMSG: ", commit.subject);
                    break;
                  }
                }
                else {
                  const commitBranch = commit.branch;
                  const branch = branchMap.get(commitBranch);
                  if (branch !== undefined) {
                    currentBranch = branch;
                  } else if (commit.parents.length > 0) {
                    const origin = commitHistory[commit.parents[0]];
                    console.log("CREATING BRANCH: " + commitBranch + " DIVERGING FROM BRANCH: " + origin.branch + " AT COMMIT: " + origin.subject);
                    currentBranch = gitgraph.branch({ name: commitBranch, from: origin.sha });
                    branchMap.set(commitBranch, currentBranch);
                  }
                  else {
                    console.log("New branch: " + commitBranch);
                    currentBranch = gitgraph.branch(commitBranch);
                    branchMap.set(commitBranch, currentBranch);
                  }


                  console.log("COMMIT: " + commit.subject + " IN BRANCH: " + currentBranch.name);
                  const author = commit.author + " <" + commit.email + ">";
                  currentBranch.commit({
                    subject: commit.subject,
                    author,
                    hash: commit.sha,
                    onClick: (commit) => onCommitClicked(commit),
                  });
                }
              }

            }}
          </Gitgraph>
        ) : (
          <p>Loading repository info...</p>
        )}
      </div>
    </Scrollbars >
  );
};

export default CommitGraph;
