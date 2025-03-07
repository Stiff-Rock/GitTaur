import MainLayout from "./components/MainLayout/MainLayout"
import ActionBar from "./components/MainLayout/ActionBar/ActionBar";
import TitleBar from "./components/TitleBar/TitleBar";

function App() {
  return (
    <main className="container">
      <TitleBar />
      <ActionBar />
      <MainLayout />
    </main>
  );
}

export default App;
