import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Disc as Discord } from
'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
export function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithDiscord, signInWithGoogle, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscord = async () => {
    setError(null);
    setDiscordLoading(true);
    try {
      await signInWithDiscord();
      // Discord OAuth opens a redirect — navigation happens automatically
    } catch (err: any) {
      setError(err.message ?? 'Discord login failed.');
      setDiscordLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message ?? 'Google login failed.');
      setGoogleLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      {/* Background accents */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center group"
            aria-label="Session Share home">
            
            <Logo
              size={32}
              wordmarkClassName="font-extrabold text-xl tracking-tight hidden sm:block" />
            
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Login card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5
          }}
          className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-400">Log in to unlock premium together.</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            {/* Discord login */}
            <button
              type="button"
              onClick={handleDiscord}
              disabled={discordLoading || googleLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-60 font-semibold transition-colors mb-3">
              {discordLoading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Discord className="w-5 h-5" />}
              {discordLoading ? 'Redirecting…' : 'Continue with Discord'}
            </button>

            {/* Google login */}
            <button
              type="button"
              id="google-login-btn"
              onClick={handleGoogle}
              disabled={googleLoading || discordLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-white hover:bg-zinc-100 disabled:opacity-60 font-semibold text-black transition-colors mb-6">
              {googleLoading
                ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-4 mb-6" aria-hidden="true">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300 mb-2">
                  
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                  
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zinc-300">
                    
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-lime-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                    
                    {showPassword ?
                    <EyeOff className="w-5 h-5" /> :

                    <Eye className="w-5 h-5" />
                    }
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-lime-400 focus:ring-lime-400/30 focus:ring-2" />
                
                Keep me logged in
              </label>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-white text-black font-bold hover:bg-lime-400 disabled:opacity-60 transition-colors group">
                
                {loading
                  ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : <>
                      Log in
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-lime-400 hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}