//home/project/src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import DualHeader from './components/DualHeader';
import AdUnit from './components/AdUnit';
import ScrollToTopButton from './components/ScrollToTopButton';
import { AuthForm } from './components/AuthForm';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Collection from './components/Collection';
import CollectionDetailPage from './components/CollectionDetailPage';
import ReviewsSection from "./components/ReviewsSection";
import UsageAndPayment from './components/UsageAndPayment';
import PublicPlansAndPricing from './components/PublicPlansAndPricing';

// Pages
import QRGenerator from "./pages/QRGenerator";
import QRAnalyse from './pages/QRAnalyse';
import RedirectQr from './pages/RedirectQr';
import UpdateQR from './pages/UpdateQR';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import PlansAndPricing from './pages/PlansAndPricing';
import AdminDashboard from './pages/AdminDashboard';
import LogOutHome from './pages/LogOutHome';
import ResetPassword from './pages/ResetPassword';
import LearningCenter, { LearningCenterRoutes } from './pages/LearningCenter';
import EnhancedQRGeneratorPage from './pages/EnhancedQRGenerator';
import EnhancedRedirectQr from './pages/EnhancedRedirectQr';

// Auth Context
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = (isOpen: boolean) => setIsMenuOpen(isOpen);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": "BAAqdwdl2V3aGRer3f4k-Z5N8sn6XguA4bekaRDe2VJrJ80jLAyLdAeMQq6mGseLkyGWwfFkEEuiV2_Xkc",
        components: "buttons",
        vault: true,
      }}
    >
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
          <Header onMenuToggle={handleMenuToggle} />
          <DualHeader />
          <AdUnit />
          <main className="flex-grow container mx-auto px-4 py-8 z-10">
            <Routes>
              {/* Home */}
              <Route
                path="/"
                element={user ? <Navigate to="/dashboard" replace /> : <LogOutHome />}
              />

              {/* QR Code Pages */}
              <Route path="/generator" element={<QRGenerator />} />

              {/* New QR Management Pages */}
              <Route
                path="/analyse/:qrCodeId"
                element={user ? <QRAnalyse /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/edit/:qrCodeId"
                element={user ? <UpdateQR /> : <Navigate to="/login" replace />}
              />
              <Route path="/r/:shortId" element={<RedirectQr />} />
              <Route path="/e/:shortId" element={<EnhancedRedirectQr />} />

              {/* Informational Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/reviews" element={<ReviewsSection />} />

              {/* Auth Pages */}
              <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <AuthForm isLogin={true} />}
              />
              <Route
                path="/signup"
                element={user ? <Navigate to="/" replace /> : <AuthForm isLogin={false} />}
              />
              <Route
                path="/reset-password"
                element={user ? <Navigate to="/" replace /> : <ResetPassword />}
              />
              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/login" replace />}
              />

              {/* Plans */}
              <Route path="/plans-and-quota" element={<PlansAndPricing />} />
              <Route
                path="/usage-and-payment"
                element={user ? <UsageAndPayment /> : <Navigate to="/login" replace />}
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={user ? <AdminDashboard /> : <Navigate to="/login" replace />}
              />

              {/* User Pages */}
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/history"
                element={user ? <History /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/collections"
                element={user ? <Collection /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/collections/:collectionId"
                element={user ? <CollectionDetailPage /> : <Navigate to="/login" replace />}
              />

              {/* Learning Center Routes */}
              <Route path="/learning-center/*" element={<LearningCenterRoutes />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <ScrollToTopButton isMenuOpen={isMenuOpen} />
        </div>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;
