import React, { ReactNode } from "react";
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import { useMainContext } from "../../../../../context/MainContext";
import { useGitGraphContext } from "./GitGraphContext";

const GraphSvg: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { commitNodesMap, GRAPH_PADDING, maxX, Y_SPACING } = useGitGraphContext();

  const { scrollbarRef, currentAppTab } = useMainContext();

  const graphContentRef = React.useRef<SVGGElement>(null);

  const [svgDimensions, setSvgDimensions] = React.useState({
    width: 0,
    height: 0,
    translateX: 0,
    translateY: 0
  });

  //BUG: MAYBE CALCULATE DIMENTIONS OBTAINING MIN/MAX X/Y 
  //FROM THE ELEMENTS THROUGH THE CONTEXT. STILL FINDING ISSUES WITH USEEFFECTS
  //requestanimationframe does not solve it, try doing ctrl + s here and see the horizontal scrolllbar

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

  // Calculate dimensions with the highest X and Y values
  React.useLayoutEffect(() => {
    setSvgDimensions({
      width: maxX + GRAPH_PADDING,
      height: maxY + GRAPH_PADDING + Y_SPACING,
      translateX: GRAPH_PADDING - maxX,
      translateY: GRAPH_PADDING - maxY
    });
  }, [maxX, maxY]);

  React.useEffect(() => {
    console.log("x:", svgDimensions.width, " | y:", svgDimensions.height)
  }, [svgDimensions])

  return (
    <ScrollBar
      containerHeight={100}
      autoHide={false} //WARNING: DISABLE WHEN FIXES
      offset={5}
      className={currentAppTab === "commit-history" ? '' : 'inactive'}
      ref={scrollbarRef}
    >
      <svg
        width={svgDimensions.width}
        height={svgDimensions.height}
        style={{ display: "block", overflow: "hidden" }}
      >
        <g ref={graphContentRef}>
          {children}
        </g>
      </svg>
    </ScrollBar>
  );
};

export default GraphSvg;
