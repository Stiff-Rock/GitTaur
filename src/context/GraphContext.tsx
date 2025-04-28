import React, { createContext, useState, useContext } from 'react';

export interface RectDims { width: number, height: number, x: number, y: number };

interface GraphContextType {
  // State 
  bboxMap: Map<string, RectDims>;

  // Setters 
  setBboxMap: React.Dispatch<React.SetStateAction<Map<string, RectDims>>>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bboxMap, setBboxMap] = useState<Map<string, RectDims>>(new Map);

  return (
    <GraphContext.Provider value={{
      bboxMap, setBboxMap
    }}>
      {children}
    </GraphContext.Provider>
  );
}

export const useGraphContext = (): GraphContextType => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraphContexy must be used within an GraphProvider');
  }
  return context;
};
