import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // The owner's email defined by the Trust
  const OWNER_EMAIL = 'ramadass17810@gmail.com';

  useEffect(() => {
    const savedUser = localStorage.getItem('sasta_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const isOwner = userInfo.email === OWNER_EMAIL;

        const userData = {
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          role: isOwner ? 'owner' : 'user',
        };

        setUser(userData);
        localStorage.setItem('sasta_user', JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    },
    onError: errorResponse => console.error('Sign-in failed', errorResponse),
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sasta_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
