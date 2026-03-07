import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Navbar (){
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    toast.success("You have logged out successfully!");
    navigate("/login", { replace: true });
  };

  const navItem = (path) =>
  `text-sm font-bold px-2 py-1 transition duration-200 border-b-2 ${
    location.pathname === path
      ? "text-teal-700 border-teal-700"
      : "text-slate-600 border-transparent hover:text-teal-700 hover:border-teal-400"
  }`;

  return (
    <header className="sticky top-0 z-50 border-b border-teal-900/10 bg-white/40 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}

          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >

            <span className="material-symbols-outlined text-teal-700 text-4xl">
              ecg_heart
            </span>

            <span className="text-teal-900 text-xl font-bold">
              QCardio
            </span>

          </div>


          {/* Navigation */}

          <nav className="hidden md:flex items-center gap-8 font-bold">

            <button
              onClick={() => navigate("/dashboard")}
              className={navItem("/dashboard")}
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/upload-cad-ecg")}
              className={navItem("/upload-cad-ecg")}
            >
              Upload ECG
            </button>

            <button
              onClick={() => navigate("/f&q")}
              className={navItem("/f&q")}
            >
              F&Q
            </button>

            <button
              onClick={() => navigate("/knowledge-base")}
              className={navItem("/knowledge-base")}
            >
              Knowledge Base
            </button>


            {/* Logout */}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              Logout
            </button>

          </nav>

        </div>

      </div>

    </header>
  );
}

export default Navbar;