import React from "react";
import { CommitNode } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";

const Summary: React.FC<{ node: CommitNode }> = ({ node }) => {
  const {
    labelsHorizontalOffsets,
    maxHorizontalOffset,
    BASE_LABEL_OFFSET,
    NODE_RADIUS,
    GRAPH_PADDING,
    LABEL_X_PADDING,
    LABEL_SPACING
  } = useGitGraphContext();

  const [x, setX] = React.useState<number>(0);
  const [y, setY] = React.useState<number>(0);
  React.useEffect(() => {
    const labelOffset = labelsHorizontalOffsets.get(node.id);

    const baseX = BASE_LABEL_OFFSET + NODE_RADIUS + GRAPH_PADDING + maxHorizontalOffset - LABEL_X_PADDING;
    let xPos = baseX;
    if (labelOffset) xPos += labelOffset + LABEL_SPACING
    const yPos = node.position.y + GRAPH_PADDING;

    setX(xPos);
    setY(yPos);
  }, []);

  return (
    <text
      className="summary"
      key={`${node.id}-${node.data.subject}`}
      transform={`translate(${x}, ${y})`}
    >
      {node.data.subject}
    </text>
  );
}

export default Summary;
