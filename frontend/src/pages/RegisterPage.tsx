import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Lock, Mail, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading, isLoading } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/register', { username, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try a different username/email.");
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
          <h2 className="text-3xl font-mono font-black text-white">Create Account</h2>
          <p className="text-zinc-400 text-sm">Join the enterprise pair-programming playground</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-sans text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-sm rounded-xl font-sans text-center">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. srithesh"
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all duration-300 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="srithesh@codesync.ai"
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
                placeholder="At least 6 characters"
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all duration-300 font-sans"
              />
            </div>
          </div>

          {/* Role selector dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Choose workspace role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Shield className="w-4 h-4" />
              </span>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-300 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all duration-300 font-sans"
              >
                <option value="ROLE_USER">Candidate / General Developer</option>
                <option value="ROLE_INTERVIEWER">Technical Interviewer</option>
              </select>
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
                Register Account <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        <div className="text-center font-sans text-xs text-zinc-500 border-t border-white/5 pt-6">
          Already synced?{' '}
          <Link to="/login" className="text-brand-purple hover:underline font-bold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
