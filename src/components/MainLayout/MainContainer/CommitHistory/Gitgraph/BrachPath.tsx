import { CommitNode } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";

const BranchPath: React.FC<{ node: CommitNode }> = ({ node }) => {
  const { commitNodesMap, GRAPH_PADDING, X_SPACING, Y_SPACING } = useGitGraphContext();

  const CURVE_Y_OFFSET_PERCETANGE = 60;

  return (
    <g id={"branchPath-" + node.id} style={{ pointerEvents: 'none' }}>
      {node.data.parents.map((parentId, index) => {
        const parentNode = commitNodesMap.get(parentId);
        if (!parentNode) return null;
        // Obtain the correct color depending of whether its a merge commit or normal
        const branchColor = index === 0 ? node.branchColor : parentNode.branchColor;

        // Start point (child commit)
        const startX = node.position.x + GRAPH_PADDING;
        const startY = node.position.y + GRAPH_PADDING;

        // End point (parent commit)
        const endX = parentNode.position.x + GRAPH_PADDING;
        const endY = parentNode.position.y + GRAPH_PADDING;

        // If same lane, draw straight vertical line
        if (startX === endX) {
          return (
            <line
              className="branchPath"
              key={`${node.id}-${parentId}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={branchColor}
            />
          );
        }

        const relativeXoffset = X_SPACING * (CURVE_Y_OFFSET_PERCETANGE / 100);
        const relativeYoffset = Y_SPACING * (CURVE_Y_OFFSET_PERCETANGE / 100);

        let pathD: string;
        // Direction is towards left (new branch)
        if (startX > endX) {
          const lineYtarget = endY - relativeYoffset;
          const curveXtarget = startX - relativeXoffset;
          pathD = `M ${startX} ${startY} L ${startX} ${lineYtarget} Q ${startX} ${endY}, ${curveXtarget} ${endY} L ${endX} ${endY}`;
          // Direction is towards right (merge branch)
        } else {
          const lineXtarget = endX - relativeXoffset;
          const curveYtarget = startY + relativeYoffset;
          pathD = `M ${startX} ${startY} L ${lineXtarget} ${startY} Q ${endX} ${startY}, ${endX} ${curveYtarget} L ${endX} ${endY}`;
        }

        return (
          <path
            className="branchPath"
            key={`${node.id}-${parentId}`}
            d={pathD}
            stroke={branchColor}
            fill="none"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

export default BranchPath;
