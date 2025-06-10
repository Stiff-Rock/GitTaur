import React, { ReactNode } from "react";
import ScrollBar from "../../../../Common/ScrollBar/ScrollBar";
import { useMainContext } from "../../../../../context/MainContext";
import { useGitGraphContext } from "./GitGraphContext";

const GraphSvg: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { GRAPH_PADDING } = useGitGraphContext();

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

  // Calculate dimensions when children change
  React.useLayoutEffect(() => {
    if (graphContentRef.current && children) {
      const bbox = graphContentRef.current.getBBox();
      setSvgDimensions({
        width: bbox.width + GRAPH_PADDING,
        height: bbox.height + GRAPH_PADDING,
        translateX: GRAPH_PADDING - bbox.x,
        translateY: GRAPH_PADDING - bbox.y
      });
    }
  }, [children]);

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
