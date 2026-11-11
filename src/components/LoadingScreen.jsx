import React from 'react';

export const LoadingScreen = () => (
  <main className="trust-loading-screen" role="status" aria-live="polite" aria-busy="true">
    <div className="trust-loading-content">
      <img src="/sasta_logo.png" alt="" className="trust-loading-logo" />
      <p className="trust-loading-name">Sasta Trust</p>
      <p className="trust-loading-place">Azhudha River · Kerala</p>
      <div className="trust-loading-track" aria-hidden="true"><span /></div>
      <p className="trust-loading-label">Preparing the trust website</p>
    </div>
  </main>
);
