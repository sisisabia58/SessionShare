import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useScreenInit } from './useScreenInit';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Profile } from './pages/Profile';
import { ActivityLogs } from './pages/ActivityLogs';
import { OrderPremium } from './pages/OrderPremium';
import { Admin } from './pages/Admin';
import { Cart } from './pages/Cart';
import { Payment } from './pages/Payment';

export function App() {
  useScreenInit();
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
            <Route path="/order-premium" element={<ProtectedRoute><OrderPremium /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}