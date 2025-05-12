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

//BUG: Failed to open repository while restoring session with incorrect workspace/non existen paths

function App() {
  const { workspace, notification, setNotification, isWelcomePage, isInWelcomePage } = useAppContext();

  useEffect(() => {
    if (!notification) return;

    if (notification.toLowerCase().includes("error")) toast.error(notification);
    else toast.info(notification);

    setNotification("");

  }, [notification]);

  //TODO: DELETE THIS SYSTEM IN RELEASE
  const appLoaded = useRef<boolean>(false);
  useEffect(() => {
    if (!appLoaded.current) appLoaded.current = true;
    else invoke("reset").catch((e) => console.error(e))
  }, []);

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

      {workspace &&
        <PanelSyncProvider>
          {workspace.tabs && [...workspace.tabs].map(([key, tab]) => (
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
      }
    </main>
  );
}

export default App;
