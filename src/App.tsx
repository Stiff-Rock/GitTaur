import "./App.css";
import ButtonCloneRepository from "./components/ButtonCloneRepository";
import ButtonCreateRepository from "./components/ButtonCreateRepository";
import ButtonOpenRepository from "./components/ButtonOpenRepository";

function App() {
  return (
    <main className="container">
      <ButtonCreateRepository />
      <ButtonOpenRepository />
      <ButtonCloneRepository />
    </main>
  );
}

export default App;
