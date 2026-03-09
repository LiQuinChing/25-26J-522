import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        toast.success("You have logged out successfully!");
        navigate("/login", { replace: true });
    };

    // Helper to highlight the active tab
    const navItem = (path) =>
        `text-sm font-bold px-2 py-1 transition duration-200 border-b-2 ${
            location.pathname === path
                ? "text-teal-700 border-teal-700"
                : "text-gray-500 border-transparent hover:text-teal-700 hover:border-teal-400"
        }`;

    return (
        <nav className="bg-white/40 backdrop-blur-xl px-8 py-4 flex justify-between items-center border-b border-teal-900/10 shrink-0 sticky top-0 z-50 shadow-sm">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                {/* <i className="fas fa-heartbeat text-teal-500 text-2xl"></i> */}
                <img src="/logo.png" alt="QCardio Logo" className="w-7 h-6" />
                <span className="text-xl font-extrabold text-teal-900 tracking-tight">QCardio</span>
            </div>
            
            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
                <Link to="/dashboard" className={navItem("/dashboard")}>Dashboard</Link>
                <Link to="/knowledge-base" className={navItem("/knowledge-base")}>Knowledge Base</Link>
                <Link to="/faq" className={navItem("/faq")}>F&Q</Link>
            </div>

            {/* Right Side Tools */}
            <div className="flex items-center gap-4">
                <div className="relative hidden lg:block">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search ID or Name" 
                        className="pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-teal-500 w-64 shadow-sm bg-gray-50"
                    />
                </div>
                
                {/* User Avatar */}
                <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center text-teal-800 font-bold border-2 border-white shadow-sm">
                    VC
                </div>
                
                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="text-red-500 font-bold hover:text-red-700 transition-colors ml-2 flex items-center gap-2 cursor-pointer"
                >
                    <i className="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </nav>
    );
}