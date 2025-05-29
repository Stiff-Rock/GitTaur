import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";
import { useAppContext } from "./context/AppContext";
import WelcomePage from "./components/WelcomePage/WelcomePage";
import { useEffect, useRef } from "react";
import { MainProvider } from './context/MainContext';
import { PanelSyncProvider } from "./context/PanelSyncContext";
import { ToastContainer, toast, Zoom } from "react-toastify";
import { invoke } from "@tauri-apps/api/core";
import ConfigPage from "./components/ConfigurationPage/ConfigPage";

//TODO: FRONTEND LOGS?
function App() {
  const { workspace, notification, setNotification, isWelcomePage } = useAppContext();

  // Debug effect and invoke
  if (import.meta.env.DEV) {
    const appLoaded = useRef<boolean>(false);
    useEffect(() => {
      if (!appLoaded.current) appLoaded.current = true;
      else invoke("reset").catch((e) => console.error(e))
    }, []);
  }

  //TODO: ANY ERROR ALSO DO CONSOLE.ERROR
  useEffect(() => {
    if (!notification) return;

    if (notification.toLowerCase().includes("error")) toast.error(notification);
    else toast.info(notification);

    setNotification("");

  }, [notification]);

  const isValidPage = (path: string): boolean => {
    return path !== "ConfigPage" && !isWelcomePage(path);
  }

  return (
    <main className="container">
      <TitleBar />
      <ActionBar />
      <ToastContainer
        className="NotificationToast"
        position="top-right"
        autoClose={3000}
        newestOnTop
        hideProgressBar={true}
        pauseOnHover
        pauseOnFocusLoss
        transition={Zoom}
      />

      <WelcomePage />
      <ConfigPage />

      {workspace &&
        <PanelSyncProvider>
          {[...workspace.tabs].map(([key, _]) => (
            isValidPage(key) && (
              <MainProvider key={key} repoPath={key}>
                <MainLayout
                  key={key}
                  isActive={workspace.activeTab === key}
                />
              </MainProvider>
            ))
          )}
        </PanelSyncProvider>
      }
    </main>
  );
}

export default App;
