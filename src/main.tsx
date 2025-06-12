import "./assets/styles/variables.css";
import "./assets/styles/App.css";
import "./assets/styles/Toast.css";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from './context/AppContext';

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
