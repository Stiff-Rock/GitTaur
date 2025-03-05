import "./assets/styles/variables.css";
import "./assets/styles/App.css"
import WindowControls from "./components/TitleBar/WindowControls";
import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/MainLayout/ActionBar/ActionBar";

function App() {
  return (
    <main className="container">
      <WindowControls />
      <ActionBar />
      <MainLayout />
    </main>
  );
}

export default App;
