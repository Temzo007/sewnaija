import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <Router base="/sewnaija">
      <App />
    </Router>
  );
}
