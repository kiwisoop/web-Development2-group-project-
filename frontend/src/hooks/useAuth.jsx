import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login, logout, register, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch {
      setUser({ loggedIn: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginUser = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login(data);
      setUser({ ...res.data.data, loggedIn: true });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await register(data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
    } finally {
      setUser({ loggedIn: false });
      setLoading(false);
    }
  };

  const isLoggedIn = user?.loggedIn === true;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{ user, loading, error, checkAuth, loginUser, registerUser, logoutUser, isLoggedIn, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
