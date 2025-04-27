import React from "react";
import {
  Commit as CommitCore,
} from "@gitgraph/core";
import { ReactSvgElement } from "./types";
import graphStyles from './GraphStyles.module.css';
import { RectDims, useGraphContext } from "../../context/GraphContext";

interface CommitRectProps {
  commit: CommitCore<ReactSvgElement>;
}

const CommitRect: React.FC<CommitRectProps> = (props: CommitRectProps) => {
  const { commit } = props;
  const { selectedCommit, setSelectedCommit, bboxMap } = useGraphContext();

  const [isMouseOver, setIsMouseOver] = React.useState<boolean>(false);

  const [commitRectDimensions, setCommitRectDimensions] = React.useState<RectDims>({ width: 0, height: 0, x: 0, y: 0 });

  const rectXPadding = 10;

  //TODO: PADDING FUCKS EVERYTHING UP
  const rectHeight = 35;
  const rectYPadding = 0;

  const commonEndLimit = 500;

  React.useEffect(() => {
    const bboxDims = bboxMap.get(commit.hash);
    if (bboxDims) {
      const dotR = commit.style.dot.size;
      const minWidth = bboxDims.width + rectXPadding;

      const x = bboxDims.x - (rectXPadding / 2);
      const y = (bboxDims.y + dotR) - (rectHeight / 2)

      const width = minWidth + (commonEndLimit - minWidth);
      const height = rectHeight + rectYPadding;

      const dims: RectDims = {
        x,
        y,
        width,
        height
      };

      setCommitRectDimensions(dims);
    }
  }, [bboxMap]);

  const [isSelected, setIsSelected] = React.useState<boolean>(false);
  React.useEffect(() => {
    const isCurrentlySelected = selectedCommit === commit.hash;
    if (isCurrentlySelected !== isSelected) {
      setIsSelected(isCurrentlySelected);
    }
  }, [selectedCommit])

  return (<rect
    onClick={() => setSelectedCommit(commit.hash)}
    onMouseOver={() => setIsMouseOver(true)}
    onMouseOut={() => setIsMouseOver(false)}
    x={`${commitRectDimensions.x}`}
    y={`${commitRectDimensions.y}`}
    width={`${commitRectDimensions.width}`}
    height={`${commitRectDimensions.height}`}
    fill="transparent"
    className={
      isSelected
        ? graphStyles.selected
        : isMouseOver
          ? graphStyles.hovered
          : graphStyles.unselected
    }
  />);
}

export default CommitRect;
