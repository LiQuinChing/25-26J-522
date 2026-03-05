import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

function Login() {
  document.title = "QCardio - User Login";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto login if token exists
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate("/upload-cad-ecg");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/login", form);

      const token = res.data.access_token;
      const users = res.data.users;

      // remember me logic
      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("users", JSON.stringify(users));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("users", JSON.stringify(users));
      }

      toast.success("You have logged in successfully!");

      navigate("/upload-cad-ecg", { replace: true });

    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/google-signup", {
        token: credentialResponse.credential
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("users", JSON.stringify(res.data.users));

      toast.success("Google login successful!");

      navigate("/upload-cad-ecg", { replace: true });

    } catch (err) {
      toast.error("Google authentication failed");
    }

    setLoading(false);
  };

  return (
    <div className="font-display bg-[#B2EBF2] text-slate-800 min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* ECG Grid */}
      <div className="absolute inset-0 bg-ecg-grid z-0 pointer-events-none opacity-60"></div>

      {/* Gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-2/3 h-2/3 bg-white/40 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-2/3 h-2/3 bg-teal-200/40 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-blue-200/30 rounded-full blur-[80px]"></div>

      {/* ECG line
      <div className="absolute top-1/2 left-0 w-full h-40 -translate-y-1/2 opacity-30 hidden md:block">
        <svg className="w-full h-full stroke-teal-900 fill-none stroke-[1.5]" viewBox="0 0 1000 100">
          <path d="M0,50 L100,50 L110,40 L120,60 L130,20 L140,80 L150,50 L300,50 L310,40 L320,60 L330,10 L345,90 L360,50 L600,50 L610,35 L620,65 L630,50 L850,50 L860,10 L870,90 L880,50 L1000,50"></path>
        </svg>
      </div> */}

      {/* Animated ECG line */}
      <div className="absolute top-1/2 left-0 w-full h-40 -translate-y-1/2 opacity-40 pointer-events-none hidden md:block">

        <svg
          className="w-full h-full"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            className="ecg-line"
            d="M0,50 L100,50 L110,40 L120,60 L130,20 L140,80 L150,50 L300,50 L310,40 L320,60 L330,10 L345,90 L360,50 L600,50 L610,35 L620,65 L630,50 L850,50 L860,10 L870,90 L880,50 L1000,50"
            stroke="#0f766e"
            strokeWidth="2"
            fill="none"
          />
        </svg>

      </div>

      <main className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-stretch justify-center gap-12 relative z-10">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-between w-full md:w-5/12 py-8">

          <div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-400 rounded-lg flex items-center justify-center shadow-lg">
                <span className="material-icons text-white">monitor_heart</span>
              </div>
              <span className="text-2xl font-bold text-teal-900">
                QCardio
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 text-teal-900">
              Advanced <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">ECG</span> Intelligence Platform
            </h1>

            <p className="text-teal-800 text-lg leading-relaxed max-w-md">
              Securely access patient telemetry, analyze arrhythmias with AI
              precision, and collaborate with your cardiac care team in real-time.
            </p>

          </div>

          <div className="space-y-6 mt-12">

            <div className="flex items-center gap-4">
              <span className="material-icons text-teal-600 text-3xl">
                security
              </span>
              <div>
                <h3 className="font-semibold text-teal-900">
                  HIPAA Compliant
                </h3>
                <p className="text-sm text-teal-700">
                  End-to-end encrypted sessions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="material-icons text-teal-600 text-3xl">
                query_stats
              </span>
              <div>
                <h3 className="font-semibold text-teal-900">
                  99.9% Uptime
                </h3>
                <p className="text-sm text-teal-700">
                  Continuous monitoring availability
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="w-full md:w-5/12 lg:w-4/12">

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl overflow-hidden border-t-4 border-teal-500">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-teal-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-teal-700 text-sm">
                Please sign in to access your dashboard.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold uppercase text-teal-800 mb-2">
                  Email
                </label>

                <div className="relative">

                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-teal-500">
                    person
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="dr.smith@hospital.com"
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-teal-200 bg-white/70
                    focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition"
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div>

                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-teal-800 uppercase">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative">

                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-teal-500">
                    lock
                  </span>

                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-teal-200 bg-white/70
                    focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition"
                  />

                </div>

              </div>

              {/* REMEMBER */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer select-none group">

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                    className="hidden"
                  />

                  <div className={`w-5 h-5 flex items-center justify-center rounded border transition-all
                    ${remember ? "bg-teal-600 border-teal-600" : "bg-white/70 border-teal-300"}
                  `}>

                    <svg
                      className={`w-3 h-3 text-white transition-opacity ${
                        remember ? "opacity-100" : "opacity-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>

                  </div>

                  <span className="ml-2 text-sm text-teal-800">
                    Remember this device
                  </span>

                </label>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-lg bg-gradient-to-r from-teal-900 to-teal-600 hover:from-teal-700 hover:to-teal-400 transition flex justify-center items-center"
              >

                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign In"
                )}

              </button>

            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-[1px] bg-teal-300"></div>
              <span className="text-sm text-teal-700">OR</span>
              <div className="flex-1 h-[1px] bg-teal-300"></div>
            </div>

            {/* GOOGLE LOGIN */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google Login Failed")}
            />

            {/* REGISTER */}
            <div className="mt-6 text-center text-sm">
              <span className="text-teal-700">
                Don't have an account?
              </span>

              <Link
                to="/signup"
                className="font-bold text-teal-600 ml-1"
              >
                Register Access
              </Link>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default Login;