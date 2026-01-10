import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/Dashboard';
import { isAuthenticated, saveCredentials } from '@/lib/storage';

// Initialize default credentials on first load
const initializeCredentials = () => {
  const stored = localStorage.getItem('wolfpack_credentials');
  if (!stored) {
    saveCredentials({
      username: 'abhishekh_dey',
      password: "D1asdfghjkl;'",
    });
  }
};

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeCredentials();
    setIsLoggedIn(isAuthenticated());
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isLoggedIn ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
};

export default Index;
