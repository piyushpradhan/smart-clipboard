import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PaletteWindow } from "./windows/PaletteWindow";
import "./styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

const params = new URLSearchParams(window.location.search);
const isPalette = params.get("window") === "palette";

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    {isPalette ? <PaletteWindow /> : <App />}
  </React.StrictMode>,
);
