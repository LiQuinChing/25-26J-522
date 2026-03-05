import './App.css';
import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UploadECG from "./pages/UploadCADecg";
import ECGResult from "./pages/CADEcgResult";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <Toaster position="bottom-left" />
      <GoogleOAuthProvider clientId="498190765675-gcl6l325mvsqp2ge1ur311lg822lt0lh.apps.googleusercontent.com">
      <Router>
        <Routes>

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/upload-cad-ecg"
            element={
              <ProtectedRoute>
                <UploadECG />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cad-ecg-result"
            element={
              <ProtectedRoute>
                <ECGResult />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </Router>
    </GoogleOAuthProvider>
    </>
  );
}

export default App;