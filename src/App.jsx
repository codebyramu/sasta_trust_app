import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { OccasionDetails } from './pages/OccasionDetails';
import { AddOccasion } from './pages/Admin/AddOccasion';
import { SendReceipt } from './pages/Admin/SendReceipt';
import { UserReceipts } from './pages/UserReceipts';
import { Donate } from './pages/Donate';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

// Page transition wrapper
const PageTransition = ({ children }) => {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const { loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navigation />

      {/* Main Routed Content */}
      <main style={{ flex: 1, position: 'relative' }}>
        <PageTransition>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/occasion/:id" element={<OccasionDetails />} />
            <Route path="/donate" element={<UserReceipts />} />
            <Route path="/donations" element={<Donate />} />
            <Route path="/admin" element={<ProtectedRoute requireOwner={true}><AddOccasion /></ProtectedRoute>} />
            <Route path="/admin/receipt" element={<ProtectedRoute requireOwner={true}><SendReceipt /></ProtectedRoute>} />
          </Routes>
        </PageTransition>
      </main>

    </div>
  );
}

export default App;
