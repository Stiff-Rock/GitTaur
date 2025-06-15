import { CommitNode, makeMoreGray } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";

const Node: React.FC<{ node: CommitNode }> = ({ node }) => {
  const {
    GRAPH_PADDING,
    NODE_RADIUS,
    currentCommitId
  } = useGitGraphContext();

  let strokeColor: string;
  if (node.data.isRemoteOnly) {
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

      {node.data.isRemoteOnly &&
        <circle
          fill={strokeColor}
          r={NODE_RADIUS * 0.3}
        />
      }
    </g>
  );
}

export default Node;

