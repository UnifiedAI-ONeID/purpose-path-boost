import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./index.css";
import "./styles/admin.css";

// Mount React app
const root = document.getElementById("root")!;
createRoot(root).render(<App />);
