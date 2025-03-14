import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";
import { useAppContext } from "./context/AppContext";
import WelcomePage from "./components/WelcomePage/WelcomePage";
import { useEffect } from "react";
import { MainProvider } from './context/MainContext';
import { PanelSyncProvider } from "./context/PanelSyncContext";

function App() {
  const { workspace, notification, isInWelcomePage, isWelcomePage } = useAppContext();

  useEffect(() => {
    if (notification) {
      console.warn(notification);
    }
  }, [notification])

  return (
    <main className="container">
      <TitleBar />
      <ActionBar />
      {isInWelcomePage || !workspace ? (
        <WelcomePage />
      ) : (
        <PanelSyncProvider>
          {workspace.tabs && workspace.tabs.map(([key, tab]) => (
            !isWelcomePage(tab.repoPath) && (
              <MainProvider key={key}>
                <MainLayout
                  key={key}
                  repoPath={tab.repoPath}
                  isActive={workspace.activeTab === key}
                />
              </MainProvider>
            )
          ))}
        </PanelSyncProvider>
      )}
    </main>
  );
}

export default App;
