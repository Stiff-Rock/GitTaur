import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/MainLayout/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";
import { useAppContext } from "./context/AppContext";
import WelcomePage from "./components/WelcomePage/WelcomePage";
import { useEffect } from "react";

function App() {
  const { workspace, notification } = useAppContext();

  useEffect(() => {
    if (notification) {
      alert(notification);
    }
  }, [notification])

  return (
    <main className="container">
      <TitleBar />
      <ActionBar />
      <WelcomePage />
    </main>
  );
}

export default App;
