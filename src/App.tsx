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
import { openUrl } from "@tauri-apps/plugin-opener";
import ConfirmationModal from "./components/Common/Modals/ConfirmationModal/ConfirmationModal";
import LoadingIndicator from "./components/Common/Modals/LoadingIndicator/LoadingIndicator";

//TODO: FRONTEND LOGS?
function App() {
  const { workspace, notification, setNotification, isType, activeModal, showLoadingIndicator } = useAppContext();

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

  // Click listener to avoid opening urls in the app's webview
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!(target instanceof HTMLAnchorElement)) return;

      const href = target.href;
      if (href) {
        e.preventDefault();
        await openUrl(href);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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
      <ConfigPage />

      {workspace &&
        <PanelSyncProvider>
          {[...workspace.tabs].map(([key, _]) => (
            isType("Repo", key) && (
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

      {activeModal === "confirmation" && <ConfirmationModal />}

      {showLoadingIndicator && <LoadingIndicator />}
    </main>
  );
}

export default App;
