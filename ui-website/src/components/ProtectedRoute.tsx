import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── ProtectedRoute ────────────────────────────────────────────────
// Redirects to /login if user is not authenticated.

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ── AdminRoute ────────────────────────────────────────────────────
// Redirects to / if user does not have admin role.

export function AdminRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If loading is complete but profile is null (fetch failed or record missing),
  // redirect to the home page instead of showing the spinner indefinitely.
  if (!profile) {
    return <Navigate to="/" replace />;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

