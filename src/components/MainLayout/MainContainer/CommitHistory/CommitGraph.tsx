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
  const commitNodeRectMapRef = useRef<Map<string, SVGRectElement>>(new Map());
  const prevCommitNodeRect = useRef<SVGRectElement | null>(null);

  const onCommitClicked = (commit: Commit<ReactSvgElement>) => {
    if (repoInfo && selectedCommitNode !== commit) {
      setSelectedCommitNode(commit); //TODO: SCROLL TO COMMIT
      setSelectedCommit(commit.hash);
      setCommitInfo(repoInfo.commit_history[commit.hash]);
    }
  };

  useEffect(() => {
    const commitRect = commitNodeRectMapRef.current.get(selectedCommit);
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
              //TODO: INVESTIGAR gitgraph.import() Y git2json
              gitgraph.clear();

              console.log("\n")
              console.log(repoInfo)
              console.log("\n")

              const commitHistory = repoInfo.commit_history;
              const commits = Object.values(commitHistory);
              const branchMap = new Map<string, Branch>;

              let currentBranch: Branch;
              for (const commit of commits) {
                const commitOptions: GitgraphCommitOptions<ReactSvgElement> = {
                  subject: commit.subject,
                  author: commit.author + " <" + commit.email + ">",
                  hash: commit.sha,
                  renderDot: (commit) => {
                    const size = commit.style.dot.size;
                    const color = commit.style.dot.color;
                    return (
                      <g>
                        <rect
                          width="700"
                          height="31"
                          className={graphStyles.unselected}
                          ref={el => {
                            if (el) commitNodeRectMapRef.current.set(commit.hash, el);
                            else commitNodeRectMapRef.current.delete(commit.hash);
                          }}
                        />
                        <circle
                          cx={size}
                          cy={size}
                          r={size}
                          fill={color}
                          style={{ cursor: "pointer" }}
                          onClick={e => {
                            const rect = (e.target as SVGCircleElement).previousSibling as SVGRectElement | null;
                            if (rect)
                              onCommitClicked(commit);
                          }}
                        />
                      </g>
                    );
                  },
                };

                if (commit.parents.length > 1) {
                  const mergeRecieverBranch = branchMap.get(commit.branch);
                  const toBeMergedBranch = commitHistory[commit.parents[1]].branch;
                  if (mergeRecieverBranch !== undefined) {
                    console.log("MERGE " + toBeMergedBranch + " INTO " + mergeRecieverBranch.name);
                    mergeRecieverBranch.merge({
                      branch: toBeMergedBranch,
                      commitOptions
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
                  currentBranch.commit(commitOptions);
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
