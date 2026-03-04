// src/App.tsx
// Root application component — wraps providers and router

import { ThemeProvider } from "@/context/ThemeContext";
import AppRouter from "@/routes/AppRouter";
import { Toaster } from "sonner";

const App = () => (
  <ThemeProvider>
    <AppRouter />
    {/* Sonner — single global toast instance for the entire app */}
    <Toaster position="top-right" richColors closeButton />
  </ThemeProvider>
);

export default App;