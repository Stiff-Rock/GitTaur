import * as React from "react";
import { ReactSvgElement } from "./types";
import { Commit } from "@gitgraph/core";
import graphStyles from './GraphStyles.module.css';

interface MessageProps {
  commit: Commit<ReactSvgElement>;
  messageX: number;
  showBody?: boolean,
}

export const Message = React.forwardRef<SVGGElement, MessageProps>(
  (props, ref) => {
    const { commit, messageX, showBody = true } = props;

    if (commit.renderMessage) {
      return (
        <g ref={ref} transform={`translate(${messageX}, 0)`}>
          {commit.renderMessage(commit)}
        </g>
      );
    }

    let body = null;
    if (showBody === true && commit.body) {
      body = (
        <foreignObject width="600" x="10">
          <p className={`${graphStyles.commitInfo}`}>{commit.body}</p>
        </foreignObject>
      );
    }

    // Use commit dot radius to align text with the middle of the dot.
    const y = commit.style.dot.size;

    return (
      <g ref={ref} transform={`translate(${messageX}, ${y})`}>
        <text
          alignmentBaseline="central"
          fill={commit.style.message.color}
          style={{ font: commit.style.message.font }}
          onClick={commit.onMessageClick}
          className={`${graphStyles.commitInfo}`}
        >
          {commit.message}
        </text>
        {body}
      </g>
    );
  },
);
