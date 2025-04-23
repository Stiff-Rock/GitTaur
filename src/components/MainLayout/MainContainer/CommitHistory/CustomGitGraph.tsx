import { Gitgraph, templateExtend, TemplateName } from '@gitgraph/react';
import { ReactSvgElement } from '@gitgraph/react/lib/types';
import { Branch, GitgraphCore, Mode, Refs } from "@gitgraph/core";
//import graphStyles from "./CommitGraph.module.css";
//import { useMainContext } from '../../../../context/MainContext';

interface CustomGitGraphProps {
  repoData: CommitLog[]
}

const CustomGitGraph: React.FC<CustomGitGraphProps> = ({ repoData }) => {
  //const { setSelectedCommit, setSelectedCommitNode, selectedCommitNode, repoInfo, setCommitInfo } = useMainContext();

  const customTemplate = templateExtend(TemplateName.Metro, {
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
  });

  /*const onCommitClicked = (commit: Commit<ReactSvgElement>) => {
    if (repoInfo && selectedCommitNode !== commit) {
      setSelectedCommitNode(commit);
      setSelectedCommit(commit.hash);
      setCommitInfo(repoInfo.commit_history[commit.hash]);
    }
  };*/

  /*const gitgraphOptions: GitgraphProps = {
    renderer: {
      commit: {
        renderDot: (commit: Commit<ReactSvgElement>) => {
          const size = commit.style.dot.size;
          const color = commit.style.dot.color;
          return (
            <g id={`commit-${commit.hash}`}>
              <rect
                id={`rect-${commit.hash}`}
                width="700"
                height="31"
                className={graphStyles.unselected}
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
      }
    },
  };*/

  const customGraph: GitgraphCore<ReactSvgElement> = {
    isHorizontal: false,
    isVertical: true,
    isReverse: false,
    shouldDisplayCommitMessage: true,
    reverseArrow: false,
    initCommitOffsetX: 0,
    initCommitOffsetY: 0,
    mode: Mode.Compact,
    author: "Yago Pernas Gómez",
    commitMessage: "This is my graph!!",
    generateCommitHash: () => { return undefined },
    branchesOrderFunction: undefined,
    template: customTemplate,
    branchLabelOnEveryCommit: false,
    refs: new Refs(),
    tags: new Refs(),
    tagStyles: {},
    tagRenders: {},
    commits: new Array(),
    branches: new Map(),
    currentBranch: new Branch(),
  }

  return (
    <Gitgraph graph={customGraph} >
      {(gitgraph) => {
        gitgraph.clear();
        gitgraph.import(repoData);
      }}
    </Gitgraph >
  );
}


export default CustomGitGraph;
