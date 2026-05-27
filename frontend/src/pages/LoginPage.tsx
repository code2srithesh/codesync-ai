import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, setLoading, isLoading } = useAuthStore();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { token, id, username, email, role } = response.data;
      login(token, { id, username, email, role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials or server connection issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center items-center px-6 py-12">
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-brand-magenta/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 glass-card border border-white/5 space-y-8 relative z-10">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-brand-purple to-brand-magenta p-2.5 rounded-xl mb-2 animate-pulse-glow cursor-pointer" onClick={() => navigate('/')}>
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-mono font-black text-white">Welcome Back</h2>
          <p className="text-zinc-400 text-sm">Sign in to sync your collaborative editor sessions</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-sans text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Username or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. srithesh"
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all duration-300 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all duration-300 font-sans"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full glow-btn bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-purple/20 border border-brand-purple/30 flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        <div className="text-center font-sans text-xs text-zinc-500 border-t border-white/5 pt-6">
          New to the workspace?{' '}
          <Link to="/register" className="text-brand-purple hover:underline font-bold">
            Create account
          </Link>
        </div>
      </div>
      
      {/* Dev helper credentials badge */}
      <div className="mt-8 p-3.5 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl max-w-sm text-center space-y-1 relative z-10 text-xs font-sans text-zinc-400">
        <span className="font-bold text-brand-purple flex items-center justify-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Quick Sandbox Login</span>
        Register a custom profile, or log in if one has already been created on this server.
      </div>
    </div>
  );
};

export default LoginPage;
