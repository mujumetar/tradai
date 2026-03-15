import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Calculators from "./pages/Calculators";
import LiquideOne from "./pages/LiquideOne";
import Academy from "./pages/Academy";
import Blogs from "./pages/Blogs";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";

import TradeIdeas from "./pages/TradeIdeas";
import Pricing from "./pages/Pricing";
import UserDashboard from "./pages/UserDashboard";
import LimoAIPage from "./pages/LimoAIPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import { useEffect, useState } from "react";
import { onForegroundMessage } from "./utils/firebase";
import useSocket from "./hooks/useSocket";

import { Navigate } from "react-router-dom";
import Support from "./pages/Support";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";
import ReloadPrompt from "./components/ReloadPrompt";
import PWAInstallButton from "./components/PWAInstallButton";

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return children;
};

import { ROLES, hasRole } from "./utils/rbac";

const ProtectedAdmin = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !hasRole(user, [ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPPORT])) {
    return <Navigate to="/auth" />;
  }
  return children;
};

function App() {
  const socket = useSocket(window.location.origin);

  useEffect(() => {
    onForegroundMessage();

    // ─── GHOST MODE HIJACK ──────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const ghostToken = params.get('ghost_token');
    if (ghostToken) {
      console.log("GOD_MODE_PROTOCOL: Initiating Identity Hijack...");
      try {
        // Decode token to get user info (basic verification)
        const base64Url = ghostToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const userData = JSON.parse(window.atob(base64));
        
        localStorage.setItem("user", JSON.stringify({
          token: ghostToken,
          _id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name || "GHOST_USER"
        }));
        
        // Remove param and refresh to apply new identity
        window.location.href = "/";
      } catch (e) {
        console.error("GHOST_PROTOCOL_FAILURE:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // ─── GOD MODE SOCKET PROTOCOLS ──────────────────────────────────
    socket.on('system_emergency_broadcast', (data) => {
      // Create a persistent overlay for emergency broadcasts
      const overlay = document.createElement('div');
      overlay.id = "system-broadcast-overlay";
      overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:monospace;padding:20px;text-align:center;border:10px solid #ef4444;";
      overlay.innerHTML = `
        <h1 style="color:#ef4444;font-size:3rem;margin-bottom:20px;font-weight:black;">⚠ SYSTEM BROADCAST ⚠</h1>
        <h2 style="font-size:1.5rem;margin-bottom:30px;">${data.title}</h2>
        <p style="font-size:1.1rem;max-width:600px;line-height:1.6;color:#9ca3af;">${data.message}</p>
        <button onclick="document.getElementById('system-broadcast-overlay').remove()" style="margin-top:40px;background:#ef4444;color:white;border:none;padding:15px 40px;font-weight:bold;cursor:pointer;border-radius:5px;">ACKNOWLEDGE</button>
      `;
      document.body.appendChild(overlay);
    });

    socket.on('session_nuke', (data) => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.email === data.email) {
        console.log("CRITICAL: Session incinerated by Super Admin.");
        localStorage.removeItem('user');
        window.location.href = "/auth?reason=session_nuked";
      }
    });

    socket.on('session_nuke_all', () => {
      console.log("CRITICAL: Global extinction event triggered. Severing all sessions.");
      localStorage.removeItem('user');
      window.location.href = "/auth?reason=global_nuke";
    });

    return () => {
      socket.off('system_emergency_broadcast');
      socket.off('session_nuke');
      socket.off('session_nuke_all');
    };
  }, [socket]);

  return (
    <Router>
      <ReloadPrompt />
      <PWAInstallButton variant="banner" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/liquide-one" element={<LiquideOne />} />
        {/* <Route path="/academy" element={<Academy />} /> */}
        {/* <Route path="/calculators" element={<Calculators />} /> */}
        <Route path="/about" element={<About />} />
        <Route path="/research" element={<TradeIdeas />} />
        <Route path="/limo-ai" element={<LimoAIPage />} />
        <Route path="/support" element={<Support />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/profile" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
        <Route path="/father" element={<SuperAdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
