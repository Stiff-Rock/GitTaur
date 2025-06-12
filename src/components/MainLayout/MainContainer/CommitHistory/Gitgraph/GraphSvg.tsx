import React, { ReactNode } from "react";
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import { useMainContext } from "../../../../../context/MainContext";
import { useGitGraphContext } from "./GitGraphContext";

const GraphSvg: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { commitNodesMap, GRAPH_PADDING, maxX, Y_SPACING } = useGitGraphContext();

  const { scrollbarRef, currentAppTab } = useMainContext();

  const [svgDimensions, setSvgDimensions] = React.useState({
    width: 0,
    height: 0,
    translateX: 0,
    translateY: 0
  });

  // Obtain the highest Y value
  const [maxY, setMaxY] = React.useState<number>(0);
  React.useLayoutEffect(() => {
    if (commitNodesMap.size === 0) return;
    const nodes = [...commitNodesMap.values()];
    let newMaxYvalue = 0;
    for (const node of nodes) {
      newMaxYvalue = Math.max(newMaxYvalue, node.position.y);
    }
    if (maxY < newMaxYvalue) {
      setMaxY(newMaxYvalue);
    }
  }, [commitNodesMap.size])

  // BUG: X SHOULD AT LEAST COVER THE MAX AVIABLE SPACE SO THE RECTS ARE NOT CUT OFF, THEN IF IF HAS TO OVERFLOW THEN DO

  // Calculate dimensions with the highest X and Y values
  React.useLayoutEffect(() => {
    setSvgDimensions({
      width: maxX + GRAPH_PADDING,
      height: maxY + GRAPH_PADDING + Y_SPACING,
      translateX: GRAPH_PADDING - maxX,
      translateY: GRAPH_PADDING - maxY
    });
  }, [maxX, maxY]);

  return (
    <ScrollBar
      containerHeight={100}
      autoHide={true}
      offset={5}
      className={currentAppTab === "commit-history" ? '' : 'inactive'}
      ref={scrollbarRef}
    >
      <svg
        width={svgDimensions.width}
        height={svgDimensions.height}
        style={{ display: "block", overflow: "hidden" }}
      >
        {children}
      </svg>
    </ScrollBar>
  );
};

export default GraphSvg;
