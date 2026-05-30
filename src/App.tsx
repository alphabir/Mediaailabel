/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import APIDocs from './pages/APIDocs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import { db } from './lib/supabaseClient';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Restore authenticated session on app initialization
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await db.getCurrentUser();
        if (user) {
          setUserLoggedIn(true);
          // If on an auth gate, redirect to console
          if (['login', 'signup', 'forgot-password', 'email-verification'].includes(currentPage)) {
            setCurrentPage('dashboard');
          }
        }
      } catch (err) {
        console.error('Core session restore failed', err);
      } finally {
        setInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // Protected route guard: force redirect to login if access to dashboard is unauthenticated
  useEffect(() => {
    if (!initializing && currentPage === 'dashboard' && !userLoggedIn) {
      setCurrentPage('login');
    }
  }, [currentPage, userLoggedIn, initializing]);

  if (initializing) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col items-center justify-center font-mono space-y-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white animate-pulse">
          <span className="text-xs font-bold font-mono">MF</span>
        </div>
        <p className="text-xxs text-purple-450 uppercase font-bold tracking-wider">Loading system configurations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-600/40 selection:text-white">
      {/* Visual background atmospheric elements */}
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-purple-950/10 to-transparent pointer-events-none" />
      
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userLoggedIn={userLoggedIn}
        setUserLoggedIn={setUserLoggedIn}
      />

      <main className="flex-grow">
        {currentPage === 'home' && (
          <Home setCurrentPage={setCurrentPage} setUserLoggedIn={setUserLoggedIn} />
        )}
        {currentPage === 'features' && (
          <Features setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'pricing' && (
          <Pricing setCurrentPage={setCurrentPage} setUserLoggedIn={setUserLoggedIn} />
        )}
        {currentPage === 'docs' && (
          <APIDocs />
        )}
        {currentPage === 'login' && (
          <Login setCurrentPage={setCurrentPage} setUserLoggedIn={setUserLoggedIn} />
        )}
        {currentPage === 'signup' && (
          <Signup setCurrentPage={setCurrentPage} setUserLoggedIn={setUserLoggedIn} />
        )}
        {currentPage === 'forgot-password' && (
          <ForgotPassword setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'email-verification' && (
          <EmailVerification setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'dashboard' && (
          userLoggedIn ? (
            <Dashboard setUserLoggedIn={setUserLoggedIn} setCurrentPage={setCurrentPage} />
          ) : (
            <Login setCurrentPage={setCurrentPage} setUserLoggedIn={setUserLoggedIn} />
          )
        )}
      </main>

      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

