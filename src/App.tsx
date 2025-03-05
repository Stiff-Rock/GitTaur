import "./assets/styles/variables.css";
import "./assets/styles/App.css"
import WindowControls from "./components/TitleBar/WindowControls";
import MainLayout from "./components/MainLayout/MainLayout"

function App() {
  return (
    <main className="container">
      <WindowControls />
      <MainLayout />
    </main>
  );
}

export default App;
