import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <Router base="/sewnaija">
      <App />
    </Router>
  );
}
