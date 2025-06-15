import './GitGraph.css';
import React from "react";
import createCommitNodes, { CommitNode } from "./commitsToNodes";
import GraphSvg from "./GraphSvg";
import BranchPath from "./BrachPath";
import Node from "./Node";
import Summary from "./Summary";
import Labels from "./Labels";
import { GitGraphProvider } from "./GitGraphContext";
import Rect from "./Rect";
import Throbber from '../../../../Common/Throbber/Throbber';

const NODE_RADIUS = 8;
const X_SPACING = 35;
const Y_SPACING = NODE_RADIUS * 3.5;
const GRAPH_PADDING = 20;

const BASE_LABEL_OFFSET = 20;
const LABEL_X_PADDING = 10;
const LABEL_Y_PADDING = 5;
const LABEL_SPACING = 10;

const GitGraph: React.FC<{ repoHistory: RepoHistory | null, maxCommits: number }> = ({ repoHistory, maxCommits }) => {
  const [commitNodesMap, setCommitNodes] = React.useState<Map<string, CommitNode>>(new Map());

  // Get commit nodes
  React.useLayoutEffect(() => {
    if (!repoHistory) return;
    setCommitNodes(createCommitNodes(repoHistory, X_SPACING, Y_SPACING, maxCommits));
  }, [repoHistory]);

  const [isPending, startTransition] = React.useTransition();
  const [renderingComplete, setRenderingComplete] = React.useState(false);

  // Show loading animation
  React.useEffect(() => {
    if (commitNodesMap.size > 0 && !renderingComplete) {
      startTransition(() => {
        setRenderingComplete(true);
      });
    }
  }, [commitNodesMap, renderingComplete]);

  if (isPending || !renderingComplete) {
    return (
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
        <span>Rendering graph...</span>
      </div>
    );
  }

  const gitGraphProviderType = {
    commitNodesMap,
    currentCommitId: repoHistory?.currentCommitId ?? null,
    NODE_RADIUS,
    X_SPACING,
    Y_SPACING,
    GRAPH_PADDING,
    BASE_LABEL_OFFSET,
    LABEL_X_PADDING,
    LABEL_Y_PADDING,
    LABEL_SPACING
  }

  return (
    <GitGraphProvider {...gitGraphProviderType}>
      <GraphSvg>
        <g id="rects">
          {[...commitNodesMap.values()].map((node) => (
            <Rect key={`rect-${node.data.id}`} node={node} />
          ))}
        </g>

        <g id="branchPahts">
          {[...commitNodesMap.values()].map((node) => (
            node.data.parents.length > 0 ? (
              <BranchPath key={`branchPath-${node.data.id}`} node={node} />
            ) : null
          ))}
        </g>

        <g id="nodes">
          {[...commitNodesMap.values()].map((node) => (
            <Node key={`node-${node.data.id}`} node={node} />
          ))}
        </g>

        <g id="labels">
          {[...commitNodesMap.values()].map((node) => (
            node.data.refs.length > 0 ? (
              <Labels key={`labels-${node.data.id}`} node={node} />
            ) : null
          ))}
        </g>

        <g id="summaries">
          {[...commitNodesMap.values()].map((node) => (
            <Summary key={`summary-${node.data.id}`} node={node} />
          ))}
        </g>
      </GraphSvg >
    </GitGraphProvider>
  );
};

export default GitGraph;
