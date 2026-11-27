import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Shell from './shell';
import { Access, AccountProvider } from './account';
import { About, Contact, Gallery, Giving, Home, Services } from './public';
import { Events, EventDetails } from './events';
import { Receipts, SignIn } from './supporter';
import { StaffEvent, StaffReceipt } from './staff';
import { Page, More } from './shared';
import './site.css';

function PreviousAddress({ to }) {
  const { search, hash } = useLocation();
  return <Navigate replace to={to + search + hash} />;
}

function HomeAddress() {
  const { hash } = useLocation();
  const sections = {
    '#impact-story': '/about',
    '#how-we-help': '/services',
    '#seva-causes': '/services',
    '#gallery': '/gallery',
    '#contact': '/contact',
  };
  return sections[hash] ? <Navigate replace to={sections[hash]} /> : <Home />;
}
function DonationsAddress() {
  const { hash } = useLocation();
  return hash.startsWith('#seva-') ? (
    <Navigate replace to={'/services' + hash} />
  ) : (
    <Giving />
  );
}
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AccountProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomeAddress />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="events" element={<Events />} />
          <Route path="occasion/:id" element={<EventDetails />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="donations" element={<DonationsAddress />} />
          <Route path="signin" element={<SignIn />} />
          <Route
            path="receipts"
            element={
              <Access>
                <Receipts />
              </Access>
            }
          />
          <Route
            path="admin"
            element={
              <Access staff>
                <StaffEvent />
              </Access>
            }
          />
          <Route
            path="admin/event/:id"
            element={
              <Access staff>
                <StaffEvent />
              </Access>
            }
          />
          <Route
            path="admin/receipt"
            element={
              <Access staff>
                <StaffReceipt />
              </Access>
            }
          />
          <Route path="dashboard" element={<PreviousAddress to="/events" />} />
          <Route path="donate" element={<PreviousAddress to="/receipts" />} />
          <Route
            path="*"
            element={
              <Page title="Page not found">
                <More to="/">Return to the homepage</More>
              </Page>
            }
          />
        </Route>
      </Routes>
    </AccountProvider>
  </BrowserRouter>
);
