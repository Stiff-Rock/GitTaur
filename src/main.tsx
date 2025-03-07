import "./assets/styles/variables.css";
import "./assets/styles/App.css"
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RepoProvider } from './context/RepoContext';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RepoProvider>
      <App />
    </RepoProvider>
  </React.StrictMode>,
);
