import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Users, Sparkles, Code, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col">
      {/* Premium background neon blur filters */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-magenta/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-gradient-to-r from-brand-purple to-brand-magenta p-2 rounded-xl shadow-lg shadow-brand-purple/20 animate-pulse-glow">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <span className="font-mono text-2xl font-black tracking-tight text-white">
            CodeSync<span className="text-brand-purple">.AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="glow-btn bg-white/5 hover:bg-white/10 text-white font-semibold py-2 px-5 rounded-xl border border-white/10 flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4 text-brand-purple" />
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="text-zinc-400 hover:text-white font-semibold transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="glow-btn bg-gradient-to-r from-brand-purple to-brand-magenta hover:from-brand-purple hover:to-brand-magenta text-white font-semibold py-2 px-5 rounded-xl shadow-lg shadow-brand-purple/20 border border-brand-purple/30"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main hero section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 md:px-12 py-16 text-center max-w-7xl mx-auto w-full relative">
        <div className="animate-slide-up space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-brand-magenta" /> Modern Multiplayer Platform for Engineers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-mono font-black tracking-tight leading-tight text-white">
            Real-Time Collaborative Coding <br />
            <span className="gradient-text-purple">Supercharged by AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Experience the ultimate workspace for remote technical interviewing, multiplayer codebase brainstorming, and real-time pair programming. 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button 
              onClick={handleCTA}
              className="glow-btn bg-gradient-to-r from-brand-purple to-brand-magenta hover:from-brand-purple hover:to-brand-magenta text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl shadow-brand-purple/30 border border-brand-purple/40 flex items-center justify-center gap-3"
            >
              Get Started Free <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="glow-btn bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl text-lg border border-white/10 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 text-brand-purple fill-brand-purple" /> Live Demo Mockup
            </button>
          </div>
        </div>

        {/* Breathtaking live preview mockup frame */}
        <div className="mt-20 w-full animate-fade-in relative z-10 max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-dark-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-dark-900/60">
            <div className="flex gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 block" />
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 block" />
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80 block" />
            </div>
            <div className="text-sm font-mono text-zinc-500 bg-white/5 py-1 px-4 rounded-lg">codesync-ai://workspace-live</div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded text-xs bg-brand-purple/20 text-brand-purple font-mono font-bold animate-pulse">LIVE MULTIPLAYER</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 h-[420px]">
            {/* Editor preview mock */}
            <div className="col-span-2 bg-dark-900 p-6 font-mono text-sm text-zinc-400 flex flex-col justify-between border-r border-white/5 text-left select-none">
              <div className="space-y-1.5">
                <div><span className="text-zinc-500">1</span> <span className="text-brand-magenta">import</span> sys, time</div>
                <div><span className="text-zinc-500">2</span> </div>
                <div><span className="text-zinc-500">3</span> <span className="text-brand-purple">def</span> <span className="text-brand-blue">collab_solving</span>(developers, problems):</div>
                <div><span className="text-zinc-500">4</span>     print(<span className="text-yellow-400">"Connecting peers in real-time..."</span>)</div>
                <div className="relative">
                  <span className="text-zinc-500">5</span>     time.sleep(<span className="text-purple-400">0.2</span>)
                  {/* Glowing custom mock user cursor caret */}
                  <span className="absolute bg-brand-purple collab-cursor-overlay h-5 animate-pulse ml-1" style={{ top: 2, left: 160 }} />
                  <span className="absolute bg-brand-purple collab-cursor-flag font-sans rounded-md select-none text-[8px]" style={{ top: -14, left: 164 }}>Srithesh (Interviewer)</span>
                </div>
                <div><span className="text-zinc-500">6</span>     <span className="text-brand-purple">return</span> [dev.upper() <span className="text-brand-purple">for</span> dev <span className="text-brand-purple">in</span> developers]</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-zinc-300 font-sans"><Code className="w-4 h-4 text-brand-purple" /> python | hello_world.py</span>
                <span className="text-brand-emerald flex items-center gap-1.5 font-sans font-bold"><ShieldCheck className="w-4 h-4" /> Docker Sandbox Secured</span>
              </div>
            </div>

            {/* Sidebar live review mock */}
            <div className="bg-dark-800/40 p-6 flex flex-col justify-between text-left font-sans select-none">
              <div>
                <h4 className="text-sm font-mono font-bold tracking-tight text-white flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-magenta" /> COPILOT ANALYTICS
                </h4>
                <div className="space-y-4">
                  <div className="p-3.5 bg-brand-purple/10 border border-brand-purple/20 rounded-xl">
                    <h5 className="text-xs font-bold text-zinc-200">🤖 Optimizations Suggested</h5>
                    <p className="text-xs text-zinc-400 mt-1">Found nesting loops scan. Suggesting Map lookup solution lowering Time to $O(N)$ linear pass.</p>
                  </div>
                  <div className="p-3.5 bg-brand-magenta/10 border border-brand-magenta/20 rounded-xl">
                    <h5 className="text-xs font-bold text-zinc-200">🚀 Big-O Mathematical Complexities</h5>
                    <p className="text-xs text-zinc-400 mt-1">Time: O(N) linear iteration.<br />Space: O(1) constant register allocations.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center font-bold text-xs text-white">S</div>
                <div className="w-8 h-8 rounded-full bg-brand-magenta flex items-center justify-center font-bold text-xs text-white">A</div>
                <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center font-bold text-xs text-white">+3</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grids section */}
        <div className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 text-left space-y-3">
            <div className="bg-brand-purple/20 w-12 h-12 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold font-mono text-white">Multiplayer Collab</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Edit source files in real-time alongside team members. Styled, color-coded cursors allow tracking focus caret lines instantaneously.
            </p>
          </div>

          <div className="glass-card p-8 text-left space-y-3">
            <div className="bg-brand-magenta/20 w-12 h-12 rounded-xl flex items-center justify-center mb-2">
              <Code className="w-6 h-6 text-brand-magenta" />
            </div>
            <h3 className="text-xl font-bold font-mono text-white">Restricted Docker Box</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Compile and execute user scripts securely inside resource-constrained, un-networked sub-processes with 5.0 seconds hard time constraints.
            </p>
          </div>

          <div className="glass-card p-8 text-left space-y-3">
            <div className="bg-brand-blue/20 w-12 h-12 rounded-xl flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-brand-blue" />
            </div>
            <h3 className="text-xl font-bold font-mono text-white">Copilot AI Hub</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Instantaneous static evaluations, space/time Big-O breakdowns, subtle hint generations, and completed technical interview audit feedback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-8 text-center text-zinc-500 text-xs mt-20">
        &copy; {new Date().getFullYear()} CodeSync AI Platform. Built under enterprise architectural standards.
      </footer>
    </div>
  );
};

export default LandingPage;
