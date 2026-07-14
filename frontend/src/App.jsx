import { useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import Settings from "./pages/settings/Settings";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import CallOverlay from "./components/messages/CallOverlay";
import InstallPWA from "./components/InstallPWA";
import { applyAppearance } from "./utils/appearance";

function App() {
  const { authUser } = useAuthContext();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedWallpaper = localStorage.getItem("wallpaper") || "default";
    const savedFontSize = localStorage.getItem("fontSize") || "medium";
    const savedAccent = localStorage.getItem("accentColor") || "blue";
    applyAppearance(savedTheme, savedWallpaper, savedFontSize, savedAccent);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden md:p-4">
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
      <InstallPWA />

      {!isOnline && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fadeIn text-center p-6">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-white/10 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 text-red-500 animate-pulse">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L8.464 8.464M3 3l18 18" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">You're offline</h2>
            <p className="text-gray-400 text-sm mb-6">
              Please reconnect to continue using NovaTalk.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 border-none"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

