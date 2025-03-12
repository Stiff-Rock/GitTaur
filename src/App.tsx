import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/MainLayout/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";
import { useAppContext } from "./context/AppContext";
import WelcomePage from "./components/WelcomePage/WelcomePage";
import { useEffect, useState } from "react";
import { MainProvider } from './context/MainContext';

function App() {
  const { workspace, notification, activeTab } = useAppContext();
  const [showWelcomePage, setIsInWelcomePage] = useState(false);

  useEffect(() => {
    const inWelcomePage = activeTab === "Welcome Page"
    if (showWelcomePage !== inWelcomePage) {
      setIsInWelcomePage(inWelcomePage);
    }
  }, [activeTab])


  useEffect(() => {
    if (notification) {
      console.warn(notification);
    }
  }, [notification])

  return (
    <main className="container">
      <TitleBar />
      <ActionBar />
      {showWelcomePage || !workspace ? (
        <WelcomePage />
      ) : (
        Object.values(workspace.tabs).map((tab) => (
          tab.repoPath !== "Welcome Page" && (
            <MainProvider key={tab.repoPath}>
              <MainLayout
                key={tab.repoPath}
                repoPath={tab.repoPath}
                isActive={workspace.activeTab === tab.repoPath}
              />
            </MainProvider>
          )
        ))
      )}
    </main>
  );
}

export default App;
