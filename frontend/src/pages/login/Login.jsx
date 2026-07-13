import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { loading, login } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-[320px] max-w-sm w-full mx-auto px-4">
      <div className="w-full p-8 rounded-3xl shadow-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 flex flex-col gap-4 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent inline-block">
            NovaTalk
          </h1>
          <p className="text-gray-400 text-[11px] font-medium mt-1">Welcome back! Please login.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="label py-1 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Username</span>
            </label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-600 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="label py-1 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-600 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="text-right">
            <Link
              to="/signup"
              className="text-xs text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              Don't have an account? Sign Up
            </Link>
          </div>

          <div className="mt-2">
            <button 
              type="submit"
              className="w-full h-10 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white border-none rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-sky-500/10 transition-all flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
