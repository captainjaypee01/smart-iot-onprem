// src/App.tsx
// Root application component — wraps providers and router

import { ThemeProvider } from "@/context/ThemeContext";
import AppRouter from "@/routes/AppRouter";

const App = () => (
  <ThemeProvider>
    <AppRouter />
  </ThemeProvider>
);

export default App;