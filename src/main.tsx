
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./index.css";
import "./styles/admin.css";

console.log("Mounting React app...");

const root = document.getElementById("root");

if (!root) {
  console.error("Root element #root not found in index.html");
  throw new Error("Root element #root not found");
}

try {
  createRoot(root).render(<App />);
  console.log("React app mounted successfully");
} catch (error) {
  console.error("Failed to mount React app:", error);
}
