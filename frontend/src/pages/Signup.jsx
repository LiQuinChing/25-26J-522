import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

function Signup() {
  document.title = "QCardio - User Signup";
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [strength, setStrength] = useState({
    score: 0,
    label: "Weak",
  });

  const checkPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = ["Weak", "Fair", "Good", "Strong"];

    setStrength({
      score,
      label: levels[score - 1] || "Weak",
    });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    setForm({ ...form, [id]: value });

    if (id === "password") {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8000/signup", form);

      toast.success("Account created successfully!");

      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:8000/google-signup", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("users", JSON.stringify(res.data.users));

      toast.success("Google signup successful!");

      navigate("/upload-cad-ecg");
    } catch (err) {
      toast.error("Google authentication failed");
    }
  };

  const strengthStyles = [
    { width: "25%", color: "bg-red-400", label: "Weak" },
    { width: "50%", color: "bg-orange-400", label: "Fair" },
    { width: "75%", color: "bg-yellow-400", label: "Good" },
    { width: "100%", color: "bg-green-500", label: "Strong" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#B2EBF2] font-display">
      {/* LEFT SIDE */}
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-40 py-24">
        <div className="max-w-lg">
          {/* NEW REGISTRATION TAG */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm mb-4">

            <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>

            <span className="text-xs font-bold tracking-wide text-teal-700 uppercase">
              New Registration
            </span>

          </div>
          {/* TITLE */}
          <h1 className="text-5xl font-bold font-black text-teal-900 leading-tight">
            Monitor your{" "}
            <span className="bg-gradient-to-r from-teal-700 to-blue-600 bg-clip-text text-transparent">
              heart health
            </span>
          </h1>

          <p className="mt-4 text-teal-800 text-lg">
            Create an account to access advanced ECG analytics and AI-powered
            insights.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* NAME */}
            <div>
              <label className="text-sm font-medium text-teal-900">
                Full Name
              </label>

              <div className="relative mt-2">
                <span className="material-symbols-outlined absolute left-3 top-3 text-teal-500">
                  person
                </span>

                <input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  onChange={handleChange}
                  required
                  className="w-full pl-10 p-3 rounded-xl border border-teal-200 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-teal-900">
                Email Address
              </label>

              <div className="relative mt-2">
                <span className="material-symbols-outlined absolute left-3 top-3 text-teal-500">
                  mail
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  onChange={handleChange}
                  required
                  className="w-full pl-10 p-3 rounded-xl border border-teal-200 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            {/* PASSWORD ROW */}
            <div className="grid grid-cols-2 gap-4">
              {/* PASSWORD */}
              <div>
                <label className="text-sm font-medium text-teal-900">
                  Password
                </label>

                <div className="relative mt-2">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-teal-500">
                    lock
                  </span>

                  <input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    onChange={handleChange}
                    required
                    className="w-full pl-10 p-3 rounded-xl border border-teal-200 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-sm font-medium text-teal-900">
                  Confirm Password
                </label>

                <div className="relative mt-2">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-teal-500">
                    lock_reset
                  </span>

                  <input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    onChange={handleChange}
                    required
                    className="w-full pl-10 p-3 rounded-xl border border-teal-200 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PASSWORD STRENGTH */}
            <div className="mt-3">

              {/* Progress Background */}
              <div className="w-full h-1 bg-teal-200 rounded-full overflow-hidden">

                {/* Animated Progress */}
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    strength.score > 0
                      ? strengthStyles[strength.score - 1].color
                      : "bg-transparent"
                  }
                  ${strength.score === 4 ? "animate-pulse" : ""}
                  `}
                  style={{
                    width: strength.score > 0 ? strengthStyles[strength.score - 1].width : "0%",
                  }}
                />

              </div>

              {/* Label */}
              <p className="text-xs text-teal-700 mt-1">
                Password strength:{" "}
                <span
                  className={`font-semibold ${
                    strength.score === 1
                      ? "text-red-500"
                      : strength.score === 2
                      ? "text-orange-500"
                      : strength.score === 3
                      ? "text-yellow-600"
                      : strength.score === 4
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  {strength.label}
                </span>
              </p>

            </div>

            {/* TERMS */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer select-none">

                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  className="hidden"
                />

                <div
                  className={`w-5 h-5 flex items-center justify-center rounded border transition-all
                  ${agree ? "bg-teal-600 border-teal-600" : "bg-white/70 border-teal-300"}
                  `}
                >

                  <svg
                    className={`w-3 h-3 text-white transition-opacity ${
                      agree ? "opacity-100" : "opacity-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>

                </div>

                <span className="ml-2 text-sm text-teal-900">
                  I agree to the{" "}
                  <span className="text-teal-700 font-semibold">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-teal-700 font-semibold">
                    Privacy Policy
                  </span>
                </span>

              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button disabled={!agree} className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-lg flex items-center justify-center gap-2">
              Create Account
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-teal-300"></div>
            <span className="text-sm text-teal-700">Or continue with</span>
            <div className="flex-1 h-[1px] bg-teal-300"></div>
          </div>

          {/* GOOGLE LOGIN */}
          <div className="grid gap-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed")}
            />
          </div>

          {/* LOGIN LINK */}
          <p className="text-sm text-center mt-6 text-teal-900">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-700">
              Log In
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#B2EBF2] to-[#E0F2F1]">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-[450px] border-t-4 border-teal-500">
          {/* HEADER */}
          <div className="flex justify-between text-xs mb-4">
            <span className="flex items-center gap-2 text-teal-700 font-semibold">
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
              LIVE MONITORING
            </span>
            <span>120 BPM</span>
          </div>

          {/* ECG GRAPH */}
          <div className="relative h-40 w-full bg-teal-50/60 rounded-lg border border-teal-100 overflow-hidden flex items-center">

            <div
              className="absolute inset-0 opacity-40"
              style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,137,123,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,137,123,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
              }}
            />
            <svg viewBox="0 0 500 150" className="w-full">
              <polyline
                className="ecg-line"
                fill="none"
                stroke="#0d9488"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,75 50,75 70,60 80,90 100,75 150,75 180,75 200,20 220,130 240,75 300,75 330,60 340,90 360,75 400,75 430,20 450,130 470,75"
              />
            </svg>
          </div>

          {/* METRICS */}
          <div className="grid grid-cols-3 gap-3 mt-6 text-left">
            <div className="bg-white rounded-xl p-3 shadow">
              <p className="text-xs">Heart Rate</p>
              <p className="font-bold">72 bpm</p>
            </div>

            <div className="bg-white rounded-xl p-3 shadow">
              <p className="text-xs">O2 Level</p>
              <p className="font-bold text-blue-600">98%</p>
            </div>

            <div className="bg-white rounded-xl p-3 shadow">
              <p className="text-xs">Status</p>
              <p className="font-bold text-teal-600">Normal</p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">

          {/* Avatars */}
          <div className="flex justify-center mb-4">
            <div className="flex -space-x-3">

              <img
                className="w-10 h-10 rounded-full border-2 border-white"
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="User avatar"
              />

              <img
                className="w-10 h-10 rounded-full border-2 border-white"
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="User avatar"
              />

              <img
                className="w-10 h-10 rounded-full border-2 border-white"
                src="https://randomuser.me/api/portraits/men/76.jpg"
                alt="User avatar"
              />

              <div className="w-10 h-10 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                +2k
              </div>

            </div>
          </div>

          <p className="text-lg font-semibold text-teal-900">
            "The precision is unmatched."
          </p>

          <p className="text-sm text-teal-700">
            Trusted by over 2,000 cardiologists worldwide.
          </p>

        </div>
      </div>
    </div>
  );
}

export default Signup;