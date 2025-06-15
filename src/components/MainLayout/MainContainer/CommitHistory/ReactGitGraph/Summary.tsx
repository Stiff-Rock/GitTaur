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
    LABEL_SPACING,
    maxX,
    setMaxX,
  } = useGitGraphContext();

  const textRef = React.useRef<SVGTextElement>(null);
  const [x, setX] = React.useState<number>(0);
  const [y, setY] = React.useState<number>(0);

  React.useEffect(() => {
    const labelOffset = labelsHorizontalOffsets.get(node.id);
    const baseX = BASE_LABEL_OFFSET + NODE_RADIUS + GRAPH_PADDING + maxHorizontalOffset - LABEL_X_PADDING;
    let xPos = baseX;
    if (labelOffset) xPos += labelOffset + LABEL_SPACING;
    const yPos = node.position.y + GRAPH_PADDING;

    setX(xPos);
    setY(yPos);
  }, [node.id, node.position.y, labelsHorizontalOffsets, maxHorizontalOffset]);

  React.useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.getBBox().width;
      const newMaxXvalue = x + width;

      if (maxX < newMaxXvalue) {
        setMaxX(newMaxXvalue);
      }
    }
  }, [x, y, node.data.subject, maxX, setMaxX]);

  return (
    <text
      ref={textRef}
      className={node.data.isRemoteOnly ? "disabledSummary" : "summary"}
      key={`${node.id}-${node.data.subject}`}
      transform={`translate(${x}, ${y})`}
      dominantBaseline="middle"
    >
      {node.data.subject}
    </text>
  );
};

export default Summary;
