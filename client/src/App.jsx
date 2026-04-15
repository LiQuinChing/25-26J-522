import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import '@fortawesome/fontawesome-free/css/all.min.css';

import Navbar from './components/Navbar';
import MainSidebar from './components/MainSidebar';

// Import Pages (Ensure these files exist in your client/src/pages folder)
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
//vihara
import UploadECG from './pages/UploadECG'; 
import ResultDisplay from './pages/ResultDisplay';
import ImageToCSV from './pages/ImageToCSV';
//thisal
import Dashboard from './pages/Dashboard';
import UploadCADecg from './pages/UploadCADecg';
import ECGResult from "./pages/CADEcgResult"; 
//ayesh
import EcgKnowledgeBase from './pages/EcgKnowledgeBase'; 
import SvtAnalysis from './pages/SvtAnalysis';
//ravindu
import MyocardialInfarction from './pages/MyocardialInfarction';
import FAQ from './pages/FAQ';

// Authentication Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

// Layout Wrapper from Branch 1 (Nav, Breadcrumbs, Footer)
const DashboardLayout = ({ children }) => {
    return (
        <div className="h-screen flex flex-col bg-white font-sans overflow-hidden">
            {/* 1. Top Navigation Bar (Stays pinned to top) */}
            <Navbar />

            {/* 2. Middle Section (Sidebar + Main Content) */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Left: Sidebar (Fixed width) */}
                <MainSidebar />

                {/* Right: Main Content Area (Scrollable) */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-cyan-50">
                    <main className="flex-1">
                        {children}
                    </main>
            
                {/* Footer */}
                <footer className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center text-xs font-bold text-gray-400 border-t border-cyan-100">
                    <p>&copy; 2026 CardioAI Platform. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span className="flex items-center gap-1 text-teal-600"><i className="fas fa-lock"></i> HIPAA Compliant</span>
                        <button className="hover:text-gray-600">Terms</button>
                        <button className="hover:text-gray-600">Privacy</button>
                        <button className="hover:text-gray-600">Support</button>
                    </div>
                </footer>
        </div>
        </div>
        </div>
    );
};

// Main App Component with Routing
function App() {
  return (
    <>
      <Toaster position="bottom-left" />
      <GoogleOAuthProvider clientId="498190765675-6dd7d3j8po0l396kpuj1t9fsr0cn6teq.apps.googleusercontent.com">
        <Router>
          <Routes>
            {/* Public Routes (No Layout) */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes (Wrapped in DashboardLayout) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/*vihara*/}
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
              path="/img-csv" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ImageToCSV />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            {/*thisal*/}
            <Route
              path="/upload-cad-ecg"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UploadCADecg />
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
            {/* --- NEW Branch 3 Routes ayesh--- */}
            <Route 
            path="/knowledge-base" 
            element={
            <ProtectedRoute>
                <DashboardLayout>
                    <EcgKnowledgeBase />
                    </DashboardLayout>
                    </ProtectedRoute>
                } 
            />
            <Route 
            path="/svt-analysis" 
            element={
            <ProtectedRoute>
                <DashboardLayout>
                    <SvtAnalysis />
                </DashboardLayout>
            </ProtectedRoute>
                } 
            />
            <Route 
            path="/myocardial-infarction" 
            element={
            <ProtectedRoute>
              <DashboardLayout>
                <MyocardialInfarction />
              </DashboardLayout>
            </ProtectedRoute>
                  } 
            />
            
          <Route 
              path="/faq" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <FAQ />
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
