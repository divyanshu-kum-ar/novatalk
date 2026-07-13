import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import Settings from "./pages/settings/Settings";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import CallOverlay from "./components/messages/CallOverlay";
import { applyAppearance } from "./utils/appearance";

function App() {
  const { authUser } = useAuthContext();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedWallpaper = localStorage.getItem("wallpaper") || "default";
    const savedFontSize = localStorage.getItem("fontSize") || "medium";
    const savedAccent = localStorage.getItem("accentColor") || "blue";
    applyAppearance(savedTheme, savedWallpaper, savedFontSize, savedAccent);
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden md:p-4">
      <Routes>
        <Route
          path="/"
          element={authUser ? <Home /> : <Navigate to={"/login"} />}
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <SignUp />}   
        />
        <Route
          path="/settings"
          element={authUser ? <Settings /> : <Navigate to={"/login"} />}   
        />
      </Routes>
      <Toaster />
      <CallOverlay />
    </div>
  );
}

export default App;
