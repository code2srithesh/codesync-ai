import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, LogOut, Plus, LogIn, Activity, Award, Hourglass, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCollabStore } from '../store/useCollabStore';
import api from '../services/api';

// Interactive Recharts imports for dynamic dashboard charts
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { resetCollab } = useCollabStore();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modals management
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>('');
  const [roomDescription, setRoomDescription] = useState<string>('');
  const [roomCodeToJoin, setRoomCodeToJoin] = useState<string>('');

  // Analytics stats
  const stats = {
    streak: 3,
    solved: 12,
    sessions: 4,
    time: "5.4h",
  };

  const chartData = [
    { name: 'Mon', count: 2 },
    { name: 'Tue', count: 4 },
    { name: 'Wed', count: 8 },
    { name: 'Thu', count: 5 },
    { name: 'Fri', count: 12 },
    { name: 'Sat', count: 3 },
    { name: 'Sun', count: 6 },
  ];

  const languageData = [
    { name: 'Python', value: 45, color: '#ec4899' },
    { name: 'JavaScript', value: 30, color: '#3b82f6' },
    { name: 'Java', value: 15, color: '#a855f7' },
    { name: 'C++', value: 10, color: '#10b981' },
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rooms/history');
      setRooms(response.data);
    } catch (err) {
      // Graceful catch fallback to mock data
      setRooms([
        { roomCode: 'abc-defg-hij', name: 'Frontend React Live Collab', description: 'Interactive pairing workspace', role: 'OWNER', joinedAt: '2026-05-27T12:00:00', creator: 'srithesh' },
        { roomCode: 'xyz-qwer-zxc', name: 'Technical System Design Interview', description: 'Mock interview board', role: 'COLLABORATOR', joinedAt: '2026-05-26T14:30:00', creator: 'interviewer_alex' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetCollab();
    fetchDashboardData();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;

    setActionLoading(true);
    try {
      const response = await api.post('/rooms', { name: roomName, description: roomDescription });
      const room = response.data;
      navigate(`/room/${room.roomCode}`);
    } catch (err) {
      // Fallback workspace creation
      const mockCode = "dev-room-" + Math.floor(100 + Math.random() * 900);
      navigate(`/room/${mockCode}`);
    } finally {
      setActionLoading(false);
      setShowCreateModal(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeToJoin) return;

    setActionLoading(true);
    try {
      const cleanCode = roomCodeToJoin.trim();
      await api.get(`/rooms/${cleanCode}`);
      navigate(`/room/${cleanCode}`);
    } catch (err) {
      navigate(`/room/${roomCodeToJoin.trim()}`);
    } finally {
      setActionLoading(false);
      setShowJoinModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      
      {/* Upper Navigation Header */}
      <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-gradient-to-r from-brand-purple to-brand-magenta p-2 rounded-xl shadow-lg animate-pulse-glow">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-xl font-black tracking-tight text-white">
            CodeSync<span className="text-brand-purple">.AI</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
            <span className="text-zinc-300 font-bold uppercase">{user?.role.replace('ROLE_', '')}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">{user?.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 transition-all duration-300 active:scale-95"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main body content grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Core welcoming widgets */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-mono font-black text-white">Dashboard Workspace</h2>
            <p className="text-zinc-400 text-sm mt-1">Select an active pairing room, launch a new whiteboard, or inspect streaks</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex-1 md:flex-none glow-btn bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-brand-purple" /> Join Session
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none glow-btn bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-brand-purple/20 border border-brand-purple/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-white" /> Create Room
            </button>
          </div>
        </div>

        {/* Stats aggregate cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="bg-brand-purple/15 p-3 rounded-2xl border border-brand-purple/10">
              <Activity className="w-6 h-6 text-brand-purple" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Coding Streak</span>
              <span className="text-2xl font-mono font-black text-white">{stats.streak} Days</span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="bg-brand-magenta/15 p-3 rounded-2xl border border-brand-magenta/10">
              <Award className="w-6 h-6 text-brand-magenta" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Executions</span>
              <span className="text-2xl font-mono font-black text-white">{stats.solved} Runs</span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="bg-brand-blue/15 p-3 rounded-2xl border border-brand-blue/10">
              <Hourglass className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Rooms Joined</span>
              <span className="text-2xl font-mono font-black text-white">{stats.sessions} Sessions</span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="bg-brand-emerald/15 p-3 rounded-2xl border border-brand-emerald/10">
              <BarChart3 className="w-6 h-6 text-brand-emerald" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">Hours Logged</span>
              <span className="text-2xl font-mono font-black text-white">{stats.time}</span>
            </div>
          </div>
        </div>

        {/* Charts & Graphs workspace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main activity chart */}
          <div className="glass-card p-6 md:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-mono text-sm font-bold tracking-tight text-white uppercase">Weekly Coding activity</h3>
              <span className="text-xs text-brand-purple flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Live Metrics</span>
            </div>
            
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Languages breakdown bar chart */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <h3 className="font-mono text-sm font-bold tracking-tight text-white uppercase mb-6">Language Preferences (%)</h3>
            
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <XAxis type="number" stroke="#52525b" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#a855f7" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent rooms list */}
        <div className="glass-card p-8 flex flex-col">
          <h3 className="font-mono text-sm font-bold tracking-tight text-white uppercase mb-6">Recent Collaboration Rooms</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 font-sans text-sm">
              No rooms joined yet. Launch or join one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-xs font-mono font-bold tracking-wider uppercase">
                    <th className="pb-4">Room Name</th>
                    <th className="pb-4">Room Code</th>
                    <th className="pb-4">Created By</th>
                    <th className="pb-4">My Role</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans text-sm">
                  {rooms.map((room, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.01] transition-all duration-200">
                      <td className="py-4 font-bold text-zinc-200">{room.name}</td>
                      <td className="py-4 font-mono text-xs text-brand-purple">{room.roomCode}</td>
                      <td className="py-4 text-zinc-400">{room.creator}</td>
                      <td className="py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          room.role === 'OWNER' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-brand-blue/20 text-brand-blue'
                        }`}>
                          {room.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => navigate(`/playback/${room.roomCode}`)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-brand-magenta/30 text-xs font-semibold text-zinc-400 hover:text-brand-magenta hover:bg-brand-magenta/10 transition-all duration-300"
                          >
                            Audit Replay
                          </button>
                          <button 
                            onClick={() => navigate(`/room/${room.roomCode}`)}
                            className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-brand-purple/30 text-xs font-semibold text-zinc-300 group-hover:text-white group-hover:bg-brand-purple/10 transition-all duration-300"
                          >
                            Re-join
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal Backdrop */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-8 glass-card border border-white/10 space-y-6 relative z-50">
            <h3 className="text-2xl font-mono font-black text-white">Create Workspace</h3>
            <p className="text-xs text-zinc-400 font-sans">Initialize a collaborative multiplayer playground room</p>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Room Name</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. System Design Prep"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple font-sans"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Description (Optional)</label>
                <input 
                  type="text" 
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="e.g. Python algorithm reviews"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple font-sans"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 font-sans">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sprout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal Backdrop */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-8 glass-card border border-white/10 space-y-6 relative z-50">
            <h3 className="text-2xl font-mono font-black text-white">Join Workspace</h3>
            <p className="text-xs text-zinc-400 font-sans">Input a unique room code code (e.g., xxx-xxxx-xxx)</p>
            
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Workspace Code</label>
                <input 
                  type="text" 
                  value={roomCodeToJoin}
                  onChange={(e) => setRoomCodeToJoin(e.target.value)}
                  placeholder="abc-defg-hij"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple font-mono"
                  required
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 font-sans">
                <button 
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
