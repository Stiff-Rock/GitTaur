import React from "react";
import { CommitNode } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";
import { useMainContext } from "../../../../../context/MainContext";

const Rect: React.FC<{ node: CommitNode }> = ({ node }) => {
  const { GRAPH_PADDING, Y_SPACING } = useGitGraphContext();

  const { selectedCommit, setSelectedCommit } = useMainContext();

  const [isHovered, setIsHovered] = React.useState(false);

  const y = node.position.y + GRAPH_PADDING - (Y_SPACING / 2);

  return (
    <rect
      x={0}
      y={y}
      onClick={() => setSelectedCommit(node.id)}
      onAuxClick={() => setSelectedCommit(node.id)}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      fill={
        selectedCommit === node.id
          ? 'rgba(120, 120, 120, 0.4)'
          : isHovered
            ? 'rgba(70, 70, 70, 0.4)'
            : 'transparent'
      }
      width="100%"
      height={Y_SPACING}
    />
  );
};

export default Rect;
