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

import { Navigate } from "react-router-dom";
import Support from "./pages/Support";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";
import ReloadPrompt from "./components/ReloadPrompt";
import PWAInstallButton from "./components/PWAInstallButton";
import MobileNav from "./components/MobileNav";

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return children;
};

const ProtectedAdmin = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !["admin", "manager", "support"].includes(user.role)) {
    return <Navigate to="/auth" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <ReloadPrompt />
      <MobileNav />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
