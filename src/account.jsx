import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { database } from './data';

const Account = createContext(null);
export const useAccount = () => useContext(Account);
export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!database);
  useEffect(() => {
    if (!database) return;
    const { data } = database.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <Account.Provider
      value={{ user, ready, owner: user?.app_metadata?.role === 'owner' }}
    >
      {children}
    </Account.Provider>
  );
}

export function Access({ staff = false, children }) {
  const { user, ready, owner } = useAccount();
  const { pathname } = useLocation();
  if (!ready) return <p className="wrap status">Checking your account…</p>;
  if (!user)
    return (
      <Navigate replace to={'/signin?next=' + encodeURIComponent(pathname)} />
    );
  if (staff && !owner) return <Navigate replace to="/receipts" />;
  return children;
}
