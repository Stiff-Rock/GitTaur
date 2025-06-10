import { CommitNode } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";

const Node: React.FC<{ node: CommitNode }> = ({ node }) => {
  const { GRAPH_PADDING, NODE_RADIUS } = useGitGraphContext();

  return (
    <g
      key={node.id}
      id={node.id}
      style={{ pointerEvents: 'none' }}
      transform={`translate(${node.position.x + GRAPH_PADDING}, ${node.position.y + GRAPH_PADDING})`}
    >
      <circle
        className="node"
        stroke={node.nodeColor}
        r={NODE_RADIUS}
      />
    </g>
  );
}

export default Node;

