import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useState } from "react";
import useSignup from "../../hooks/useSignup";

const SignUp = () => {
  const [inputs, setInputs] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });

  const { loading, signup } = useSignup();

  const handleCheckboxChange = (gender) => {
    setInputs({ ...inputs, gender });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(inputs);
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-[320px] max-w-sm w-full mx-auto px-4">
      <div className="w-full p-6 md:p-8 rounded-3xl shadow-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 flex flex-col gap-3 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent inline-block">
            NovaTalk
          </h1>
          <p className="text-gray-400 text-[11px] font-medium mt-1">Create an account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="label py-0.5 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-650 transition-all"
              value={inputs.fullName}
              onChange={(e) =>
                setInputs({ ...inputs, fullName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label py-0.5 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Username</span>
            </label>
            <input
              type="text"
              placeholder="johndoe"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-650 transition-all"
              value={inputs.username}
              onChange={(e) =>
                setInputs({ ...inputs, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label py-0.5 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-650 transition-all"
              value={inputs.password}
              onChange={(e) =>
                setInputs({ ...inputs, password: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label py-0.5 px-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Confirm Password</span>
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full input input-bordered h-10 bg-slate-950/40 border-slate-800 focus:border-sky-500 text-white rounded-xl text-xs placeholder:text-gray-650 transition-all"
              value={inputs.confirmPassword}
              onChange={(e) =>
                setInputs({ ...inputs, confirmPassword: e.target.value })
              }
            />
          </div>
          
          <div className="py-1 px-1">
            <GenderCheckbox
              onCheckboxChange={handleCheckboxChange}
              selectedGender={inputs.gender}
            />
          </div>

          <div className="text-right">
            <Link
              to="/login"
              className="text-xs text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>

          <div className="mt-1">
            <button
              type="submit"
              className="w-full h-10 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white border-none rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-sky-500/10 transition-all flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Sign Up"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SignUp;