import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase reads the hash/query params automatically after OAuth redirect.
    // We just need to wait for the session to be set.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 gap-4">
      <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-400 text-sm">Completing sign-in…</p>
    </div>
  );
}
