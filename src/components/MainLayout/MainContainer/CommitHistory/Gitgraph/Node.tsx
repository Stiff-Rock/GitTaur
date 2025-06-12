import { CommitNode, makeMoreGray } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";

const Node: React.FC<{ node: CommitNode }> = ({ node }) => {
  const {
    GRAPH_PADDING,
    NODE_RADIUS,
    currentCommitId
  } = useGitGraphContext();

  const refs = node.data.refs;
  let strokeColor: string;
  const isRemoteOnly = !refs.some(r => r.includes("branch")) && refs.some(r => r.includes("remoteBranch"));
  if (isRemoteOnly) {
    strokeColor = makeMoreGray(node.nodeColor);
  } else {
    strokeColor = node.nodeColor;
  }

  return (
    <g
      key={node.id}
      id={node.id}
      style={{ pointerEvents: 'none' }}
      transform={`translate(${node.position.x + GRAPH_PADDING}, ${node.position.y + GRAPH_PADDING})`}
    >
      <circle
        className="node"
        stroke={strokeColor}
        r={NODE_RADIUS}
      />

      {currentCommitId === node.id &&
        <circle
          fill={strokeColor}
          r={NODE_RADIUS * 0.6}
        />
      }

      {isRemoteOnly &&
        <circle
          fill={strokeColor}
          r={NODE_RADIUS * 0.4}
        />
      }
    </g>
  );
}

export default Node;

