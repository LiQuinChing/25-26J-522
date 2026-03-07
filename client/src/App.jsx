import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import Pages (Ensure these files exist in your client/src/pages folder)
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UploadECG from './pages/UploadECG'; // Using the name from Branch 1
import ResultDisplay from './pages/ResultDisplay';
import ECGResult from "./pages/CADEcgResult"; 

// Authentication Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

// Layout Wrapper from Branch 1 (Nav, Breadcrumbs, Footer)
const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-cyan-50 font-sans">
            {/* Top Navigation Bar */}
            <nav className="bg-cyan-50 px-8 py-4 flex justify-between items-center border-b border-cyan-100">
                <div className="flex items-center gap-2">
                    <i className="fas fa-heartbeat text-teal-500 text-2xl"></i>
                    <span className="text-xl font-extrabold text-teal-900 tracking-tight">CardioAI</span>
                </div>
                
                <div className="hidden md:flex space-x-8">
                    <button className="text-gray-500 font-semibold hover:text-teal-600 transition-colors">Dashboard</button>
                    <button className="text-teal-600 border-b-2 border-teal-500 font-bold pb-1">Patients</button>
                    <button className="text-gray-500 font-semibold hover:text-teal-600 transition-colors">Analysis</button>
                    <button className="text-gray-500 font-semibold hover:text-teal-600 transition-colors">Devices</button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search ID or Name" 
                            className="pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-teal-500 w-64 shadow-sm"
                        />
                    </div>
                    <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center text-teal-800 font-bold border-2 border-white shadow-sm cursor-pointer">
                        VC
                    </div>
                </div>
            </nav>

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-8 py-4">
                <p className="text-sm text-gray-500 font-medium">
                    Patients <span className="mx-2">&gt;</span> Upload <span className="mx-2">&gt;</span> <span className="text-teal-600">New Scan</span>
                </p>
            </div>

            {/* Main Content Area */}
            <main>
                {children}
            </main>
            
            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-8 py-6 mt-12 flex justify-between items-center text-xs font-bold text-gray-400 border-t border-cyan-100">
                <p>&copy; 2026 CardioAI Platform. All rights reserved.</p>
                <div className="flex gap-6">
                    <span className="flex items-center gap-1 text-teal-600"><i className="fas fa-lock"></i> HIPAA Compliant</span>
                    <button className="hover:text-gray-600">Terms</button>
                    <button className="hover:text-gray-600">Privacy</button>
                    <button className="hover:text-gray-600">Support</button>
                </div>
            </footer>
        </div>
    );
};

// Main App Component with Routing
function App() {
  return (
    <>
      <Toaster position="bottom-left" />
      <GoogleOAuthProvider clientId="498190765675-gcl6l325mvsqp2ge1ur311lg822lt0lh.apps.googleusercontent.com">
        <Router>
          <Routes>
            {/* Public Routes (No Layout) */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes (Wrapped in DashboardLayout) */}
            <Route
              path="/upload-cad-ecg"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UploadECG />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload-ecg"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UploadECG />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/result-display"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResultDisplay />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cad-ecg-result"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ECGResult />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;