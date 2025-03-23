import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import Scrollbars from "react-custom-scrollbars-2";
import styles from "../MainContainer.module.css";
import graphStyles from "./CommitGraph.module.css"
import { useMainContext } from "../../../../context/MainContext.tsx";

const CommitGraph: React.FC = () => {
  const { scrollbarsRef, selectedCommitRef, setSelectedCommit, repoInfo, setCommitInfo } = useMainContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !repoInfo || !containerRef.current) return;

    const commits = Object.values(repoInfo.commits);
    const margin = 20;
    const nodeSpacing = 50;
    const fixedHeight = margin + (commits.length - 1) * nodeSpacing + margin;
    const baseX = 50;

    const commitMap: { [sha: string]: number } = {};
    commits.forEach((commit, index) => {
      commitMap[commit.sha] = index;
    });

    const svg = d3.select(svgRef.current)
      .attr("height", fixedHeight);

    svg.selectAll("*").remove();

    const links = commits.flatMap((commit, index) =>
      commit.parents.map(parentSha => ({
        source: index,
        target: commitMap[parentSha]
      })).filter(link => link.target !== undefined)
    );

    svg.selectAll("line")
      .data(links)
      .join("line")
      .attr("x1", baseX)
      .attr("y1", d => margin + d.source * nodeSpacing)
      .attr("x2", baseX)
      .attr("y2", d => margin + d.target * nodeSpacing)
      .attr("class", graphStyles.commitLink);

    const commitGroups = svg.selectAll("g.commit")
      .data(commits)
      .join("g")
      .attr("transform", (_, i) => `translate(${baseX}, ${margin + i * nodeSpacing})`)
      .attr("class", graphStyles.commit);

    commitGroups.append("rect")
      .attr("x", -0.4 * 80)
      .attr("y", -20)
      .attr("width", "100%")
      .attr("height", 40)
      .attr("rx", 10)
      .attr("ry", 10)

    commitGroups.append("circle")
      .attr("r", 10)
      .attr("class", graphStyles.commitCircle);

    commitGroups.append("text")
      .attr("x", 20)
      .attr("y", 5)
      .text(d => d.subject)
      .attr("class", graphStyles.commitText);

    commitGroups.on("click", (event, d) => {
      svg.selectAll(`.${graphStyles.selected}`).classed(graphStyles.selected, false);

      d3.select(event.currentTarget)
        .classed(graphStyles.selected, true);

      setSelectedCommit(d.sha);
      setCommitInfo(d)
    });
  }, [repoInfo?.commits]);

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
