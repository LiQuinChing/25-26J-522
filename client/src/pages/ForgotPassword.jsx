import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function ForgotPassword() {

  document.title = "QCardio - Forgot Password";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      await axios.post("http://localhost:8000/forgot-password", { email });

      toast.success("Password reset link sent to your email");

    } catch (err) {

      toast.error(err.response?.data?.detail || "Failed to send reset email");

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

      {/* ECG line */}
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
              Reset Your <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Password</span>
            </h1>

            <p className="text-teal-800 text-lg leading-relaxed max-w-md">
              Enter your registered email address and we'll send you a secure
              password reset link.
            </p>

          </div>

          <div className="space-y-6 mt-12">

            <div className="flex items-center gap-4">
              <span className="material-icons text-teal-600 text-3xl">
                security
              </span>
              <div>
                <h3 className="font-semibold text-teal-900">
                  Secure Recovery
                </h3>
                <p className="text-sm text-teal-700">
                  Password reset links expire automatically
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="material-icons text-teal-600 text-3xl">
                verified_user
              </span>
              <div>
                <h3 className="font-semibold text-teal-900">
                  Protected Accounts
                </h3>
                <p className="text-sm text-teal-700">
                  Your credentials remain encrypted
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* RESET CARD */}
        <div className="w-full md:w-5/12 lg:w-4/12">

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl overflow-hidden border-t-4 border-teal-500">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-teal-900 mb-2">
                Forgot Password
              </h2>

              <p className="text-teal-700 text-sm">
                Enter your email to receive a password reset link.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

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
                    type="email"
                    placeholder="dr.smith@hospital.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-teal-200 bg-white/70
                    focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition"
                  />

                </div>

              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-lg bg-gradient-to-r from-teal-900 to-teal-600 hover:from-teal-700 hover:to-teal-400 transition flex justify-center items-center"
              >

                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Send Reset Link"
                )}

              </button>

            </form>

            {/* BACK TO LOGIN */}
            <div className="mt-6 text-center text-sm">

              <span className="text-teal-700">
                Remember your password?
              </span>

              <Link
                to="/login"
                className="font-bold text-teal-600 ml-1"
              >
                Back to Login
              </Link>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default ForgotPassword;