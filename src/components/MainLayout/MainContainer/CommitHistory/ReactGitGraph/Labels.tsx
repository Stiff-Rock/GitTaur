import React from "react";
import { Dimensions, Position, useGitGraphContext } from "./GitGraphContext";
import { CommitNode, makeMoreGray } from "./commitsToNodes";
import { useMainContext } from "../../../../../context/MainContext";

const LABEL_ICON_SIZE = 14;
const LABEL_TEXT_PADDING = 5;

const Labels: React.FC<{ node: CommitNode }> = ({ node }) => {
  const {
    labelsHorizontalOffsets,
    maxHorizontalOffset,
    NODE_RADIUS,
    GRAPH_PADDING,
    BASE_LABEL_OFFSET,
    LABEL_X_PADDING,
    LABEL_Y_PADDING,
    LABEL_SPACING,
  } = useGitGraphContext();

  const labelXpos = BASE_LABEL_OFFSET + NODE_RADIUS + GRAPH_PADDING + maxHorizontalOffset - LABEL_X_PADDING;
  const labelYpos = node.position.y + GRAPH_PADDING;

  const labelWidthsRef = React.useRef<number[]>([]);

  interface RefLabelProps {
    index: number,
    labelXpos: number,
    labelYpos: number,
    refLabel: string,
  }

  const RefLabel: React.FC<RefLabelProps> = (props) => {
    const {
      index,
      labelXpos,
      labelYpos,
      refLabel
    } = props;

    const { repoInfo } = useMainContext();

    const [dimensions, setDimensions] = React.useState<Dimensions>({ width: 0, height: 0 });
    const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });
    const containerRef = React.useRef<SVGGElement>(null);
    const textRef = React.useRef<SVGTextElement>(null);

    React.useLayoutEffect(() => {
      if (!textRef.current) return;
      const bbox = textRef.current.getBBox();

      const rightLabelPadding = 10;
      const width = bbox.width + LABEL_X_PADDING + LABEL_ICON_SIZE + rightLabelPadding;
      const height = Math.max(bbox.height, LABEL_ICON_SIZE) + LABEL_Y_PADDING;
      setDimensions({ width, height });

      const x = index === 0 ? 0 : labelWidthsRef.current[index - 1] + LABEL_SPACING;
      const y = -height / 2;
      setPosition({ x, y });

      const offset = width + x;
      labelWidthsRef.current[index] = offset;
      labelsHorizontalOffsets.set(node.id, offset);
    }, [textRef.current]);

    const parts = refLabel.split(':');
    const labelText = parts[1];
    const labelType = repoInfo?.currentBranch === labelText && index === 0 ? 'check' : parts[0];

    let strokeColor: string;
    if (node.data.isRemoteOnly) {
      strokeColor = makeMoreGray(node.nodeColor);
    } else {
      strokeColor = node.nodeColor;
    }

    return (
      <g id={refLabel} transform={`translate(${labelXpos}, ${labelYpos})`} style={{ pointerEvents: 'none' }}>
        <rect
          className="labelRect"
          width={`${dimensions.width}`}
          height={`${dimensions.height}`}
          x={position.x}
          y={position.y}
          rx={3}
          stroke={strokeColor}
          strokeWidth='1'
        />

        <g
          ref={containerRef}
          transform={`translate(${position.x + LABEL_X_PADDING / 2}, ${position.y + dimensions.height / 2})`}
        >
          <LabelIcon type={labelType} disabled={node.data.isRemoteOnly} />

          <text
            className={node.data.isRemoteOnly ? "disabledLabel" : "label"}
            ref={textRef}
            x={LABEL_ICON_SIZE + LABEL_TEXT_PADDING}
            y={0}
          >
            {labelText}
          </text>
        </g>
      </g>
    );
  };

  return (
    <g key={`${node.id}-refs`} id={`${node.id}-refs`}>
      {
        node.data.refs.map((refName, index) => {
          return (
            <RefLabel
              key={`${node.id}-${refName}`}
              index={index}
              refLabel={refName}
              labelXpos={labelXpos}
              labelYpos={labelYpos}
            />
          );
        })
      }
    </g>
  );
}

const LabelIcon: React.FC<{ type: string, disabled: boolean }> = ({ type, disabled }) => {
  return (
    <g className={disabled ? "disabledLabelIcon" : "labelIcon"}>
      {type === 'check' ? <CheckIcon size={LABEL_ICON_SIZE} /> :
        type === 'tag' ? <TagIcon size={LABEL_ICON_SIZE} /> :
          type === 'branch' ? <BranchIcon size={LABEL_ICON_SIZE} /> :
            type === 'remoteBranch' ? <RemoteIcon size={LABEL_ICON_SIZE} /> :
              <OtherIcon size={LABEL_ICON_SIZE} />}
    </g>
  );
};

const CheckIcon: React.FC<{ size: number }> = ({ size = LABEL_ICON_SIZE }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      y={-size / 2}
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 
        0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751
        0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z">
      </path>
    </svg>
  );
};

const TagIcon: React.FC<{ size: number }> = ({ size = LABEL_ICON_SIZE }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      y={-size / 2}
    >
      <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 
        0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 
        5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 
        7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 
        0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 
        0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
      >
      </path>
    </svg>
  );
};

const BranchIcon: React.FC<{ size: number }> = ({ size = LABEL_ICON_SIZE }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      y={-size / 2}
    >
      <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0
        0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5
        0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1
        6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6
        0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75
        0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 
        1.5.75.75 0 0 0 0-1.5Z">
      </path>
    </svg>
  );
};

const RemoteIcon: React.FC<{ size: number }> = ({ size = LABEL_ICON_SIZE }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      y={-size / 2}
    >
      <path d="M2 7.25A5.225 5.225 0 0 1 7.25 2a5.222 5.222
        0 0 1 4.767 3.029A4.472 4.472 0 0 1 16 9.5c0 2.505-1.995
        4.5-4.5 4.5h-8A3.474 3.474 0 0 1 0 10.5c0-1.41.809-2.614
        2.001-3.17Zm1.54.482a.75.75 0 0 1-.556.832c-.86.22-1.484.987-1.484
        1.936 0 1.124.876 2 2 2h8c1.676 0 3-1.324 3-3s-1.324-3-3-3a.75.75
        0 0 1-.709-.504A3.72 3.72 0 0 0 7.25 3.5C5.16 3.5 3.5 5.16 3.5 
        7.25c.002.146.014.292.035.436l.004.036.001.008Z">
      </path>
    </svg>
  );
};

const OtherIcon: React.FC<{ size: number }> = ({ size = LABEL_ICON_SIZE }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      y={-size / 2}
    >
      <path d="M13.25 1c.966 0 1.75.784 1.75 1.75v10.5A1.75 
        1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25V2.75C1 1.784 1.784 
        1 2.75 1ZM2.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25
        0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z">
      </path>
    </svg>
  );
};

export default Labels;
