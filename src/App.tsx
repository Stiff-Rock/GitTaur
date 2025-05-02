import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";
import { useAppContext } from "./context/AppContext";
import WelcomePage from "./components/WelcomePage/WelcomePage";
import { useEffect } from "react";
import { MainProvider } from './context/MainContext';
import { PanelSyncProvider } from "./context/PanelSyncContext";
import { ToastContainer, toast, Zoom } from "react-toastify";

//BUG: Failed to open repository while restoring session: failed to resolve path 'C:\Users\Yago\Desktop\ChatServer': El sistema no puede encontrar el archivo especificado.; class=Os (2); code=NotFound (-3)

function App() {
  const { workspace, notification, setNotification, isWelcomePage } = useAppContext();

  useEffect(() => {
    if (!notification) return;

    if (notification.toLowerCase().includes("error")) toast.error(notification);
    else toast.info(notification);

    setNotification("");

  }, [notification]);

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
