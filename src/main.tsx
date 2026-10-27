import React from "react";
import ReactDOM from "react-dom/client";
import LobbyApp from "./lobby/LobbyApp";
const App = import.meta.env.DEV && location.pathname === '/scene-lab'
  ? React.lazy(()=>import('./lobby/SceneLab')) : LobbyApp;


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<p>Preparando expedição…</p>}><App /></React.Suspense>
  </React.StrictMode>,
);
