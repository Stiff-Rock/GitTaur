import { createContext, useState, useContext } from 'react';

type PanelSyncContextType = {
  leftSize: number;
  rightSize: number;
  setLeftSize: (size: number) => void;
  setRightSize: (size: number) => void;
};

const PanelSyncContext = createContext<PanelSyncContextType>({
  leftSize: 31,
  rightSize: 30,
  setLeftSize: () => { },
  setRightSize: () => { },
});

export const usePanelSync = () => useContext(PanelSyncContext);

export const PanelSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leftSize, setLeftSize] = useState(31);
  const [rightSize, setRightSize] = useState(30);

  return (
    <PanelSyncContext.Provider
      value={{
        leftSize,
        rightSize,
        setLeftSize,
        setRightSize
      }}
    >
      {children}
    </PanelSyncContext.Provider>
  );
};
