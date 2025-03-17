import "./assets/styles/variables.css";
import "./assets/styles/App.css";
import "./assets/styles/Toast.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from './context/AppContext';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
