import React, { createContext, useContext, useRef, useState } from 'react';
import { CommitNode } from './commitsToNodes';

interface GitGraphContextType {
  commitNodesMap: Map<string, CommitNode>
  currentCommitId: string | null

  labelsHorizontalOffsets: Map<string, number>

  graphSvgRef: React.RefObject<SVGSVGElement>
  maxHorizontalOffset: number

  NODE_RADIUS: number
  X_SPACING: number
  Y_SPACING: number,
  GRAPH_PADDING: number
  BASE_LABEL_OFFSET: number
  LABEL_X_PADDING: number
  LABEL_Y_PADDING: number
  LABEL_SPACING: number

  maxX: number
  setMaxX: React.Dispatch<React.SetStateAction<number>>
}

interface GitGraphProviderType {
  children: React.ReactNode

  commitNodesMap: Map<string, CommitNode>
  currentCommitId: string | null

  NODE_RADIUS: number
  X_SPACING: number
  Y_SPACING: number,
  GRAPH_PADDING: number
  BASE_LABEL_OFFSET: number
  LABEL_X_PADDING: number
  LABEL_Y_PADDING: number
  LABEL_SPACING: number
}

const GraphContext = createContext<GitGraphContextType | undefined>(undefined);

export interface Dimensions {
  width: number,
  height: number,
}

export interface Position {
  x: number,
  y: number,
}

export const GitGraphProvider: React.FC<GitGraphProviderType> = ({
  children,
  commitNodesMap,
  currentCommitId,

  NODE_RADIUS,
  X_SPACING,
  Y_SPACING,
  GRAPH_PADDING,
  BASE_LABEL_OFFSET,
  LABEL_X_PADDING,
  LABEL_Y_PADDING,
  LABEL_SPACING
}) => {

  let maxHorizontalOffset = 0;
  const labelsHorizontalOffsets: Map<string, number> = new Map();
  for (const [id, node] of commitNodesMap) {
    labelsHorizontalOffsets.set(id, 0);

    if (node.position.x > maxHorizontalOffset) {
      maxHorizontalOffset = node.position.x;
    }
  }

  const graphSvgRef = useRef<SVGSVGElement>() as React.RefObject<SVGSVGElement>;

  const [maxX, setMaxX] = useState(0);

  return (
    <GraphContext.Provider value={{
      maxHorizontalOffset,
      graphSvgRef,

      NODE_RADIUS,
      X_SPACING,
      Y_SPACING,
      GRAPH_PADDING,
      BASE_LABEL_OFFSET,
      LABEL_X_PADDING,
      LABEL_Y_PADDING,
      LABEL_SPACING,

      labelsHorizontalOffsets,

      commitNodesMap,
      currentCommitId,

      maxX, setMaxX,
    }}>
      {children}
    </GraphContext.Provider>
  );
}

export const useGitGraphContext = (): GitGraphContextType => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGitGraphContex must be used within an GraphProvider wrapped component');
  }
  return context;
};
