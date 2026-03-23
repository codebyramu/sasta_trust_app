import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { OccasionDetails } from './pages/OccasionDetails';
import { AddOccasion } from './pages/Admin/AddOccasion';
import { SendReceipt } from './pages/Admin/SendReceipt';
import { UserReceipts } from './pages/UserReceipts';

import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { BackgroundManager } from './components/BackgroundManager';

function App() {
  const { loading } = useAuth();

  if (loading) {
     return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}><div className="loader" style={{ width: 48, height: 48, borderWidth: 4 }}></div></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <BackgroundManager />
      
      <main style={{ flex: 1, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/occasion/:id" element={<OccasionDetails />} />
          
          <Route path="/donate" element={<UserReceipts />} />
          <Route path="/donations" element={<UserReceipts />} />

          <Route path="/admin" element={
            <ProtectedRoute requireOwner={true}>
              <AddOccasion />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/receipt" element={
            <ProtectedRoute requireOwner={true}>
              <SendReceipt />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--bg-tertiary)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Sasta Trust. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Serving devotees with Love & Tradition</p>
      </footer>
    </div>
  );
}

export default App;
