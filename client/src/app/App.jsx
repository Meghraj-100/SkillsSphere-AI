import React from "react";
import { Routes, Route } from "react-router-dom";
import ChatWidget from "../modules/ai-assistant/components/ChatWidget";
import LandingPage from "../modules/landing/LandingPage";
import ResumeAnalyzerPage from "../modules/resume-analyzer/pages/ResumeAnalyzerPage";
import ComponentDemo from "../modules/auth/components/ComponentDemo";
import Login from "../modules/auth/Login";
import Register from "../modules/auth/Register";
import ResetPassword from "../modules/auth/ResetPassword";
import VerifyEmail from "../modules/auth/VerifyEmail";
import ProfilePage from "../modules/profile/ProfilePage";

function App() {
  return (
    <div className="bg-white text-black dark:bg-dark-bg dark:text-text-main min-h-screen transition-colors duration-300">
     <Routes>
        <Route path="/" element={<LandingPage />} />
        {import.meta.env.DEV && <Route path="/demo" element={<ComponentDemo />} />}
        <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <ChatWidget />
    </div>
  );
}

export default App;
