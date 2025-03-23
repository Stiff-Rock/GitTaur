import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import { useMainContext } from "../../../../context/MainContext.tsx";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommitRef, selectedCommit, setSelectedCommit, repoInfo, setCommitInfo } = useMainContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !repoInfo || !containerRef.current) return;

    const commits = Object.values(repoInfo.commits);
    const topMargin = 50;
    const bottomMargin = 20;
    const nodeSpacing = 50;
    const fixedHeight = topMargin + (commits.length - 1) * nodeSpacing + bottomMargin;
    const baseX = 50;

    const svg = d3.select(svgRef.current)
      .attr("height", fixedHeight);

    svg.selectAll("*").remove();

    svg.selectAll("circle")
      .data(commits)
      .join("circle")
      .attr("cx", baseX)
      .attr("cy", (_, i) => topMargin + i * nodeSpacing)
      .attr("r", 10)
      .attr("fill", "#2f81f7")
      .attr("stroke", "#1f1f1f");

    svg.selectAll("text")
      .data(commits)
      .join("text")
      .attr("x", baseX + 20)
      .attr("y", (_, i) => topMargin + i * nodeSpacing + 5)
      .text(d => d.subject)
      .attr("fill", "white")
      .style("font-size", "12px");
  }, [repoInfo?.commits, containerRef.current?.clientWidth]);

  return (
    <Scrollbars
      ref={scrollbarsRef}
      autoHide
      autoHideTimeout={500}
      autoHideDuration={300}
      renderThumbVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.scrollbar}
        />
      )}
      renderTrackVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.trackVertical}
          style={{
            ...style,
            width: '10px',
            right: '2px',
            bottom: '2px',
            top: '2px',
            borderRadius: '4px'
          }}
        />
      )}
    >
      <div ref={containerRef} className={styles.container}>
        <svg ref={svgRef} />
      </div>
    </Scrollbars>
  )
};

export default CommitGraph;
