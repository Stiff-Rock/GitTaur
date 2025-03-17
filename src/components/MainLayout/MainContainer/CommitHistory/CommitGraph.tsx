import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface CommitInfo {
  sha: string;
  subject: string;
  body: string;
  author: string;
  commit_date: string;
  parents: string[];
}

interface Props {
  commits: CommitInfo[];
}

const CommitGraph: React.FC<Props> = ({ commits }) => {
  const svgRef = useRef<SVGSVGElement>(null);


  useEffect(() => {
    if (!commits.length) return;

    const width = 800;
    const height = 600;

    const nodes: d3.SimulationNodeDatum[] = commits.map((commit) => ({
      id: commit.sha,
      x: Math.random() * width,
      y: Math.random() * height,
    }));

    const links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = commits.flatMap((commit) =>
      commit.parents.map((parent) => ({ source: commit.sha, target: parent }))
    );

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => (d as any).id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#aaa");

    const node = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 6)
      .attr("fill", "blue");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [commits]);

  return <svg ref={svgRef}></svg>;
};

export default CommitGraph;
