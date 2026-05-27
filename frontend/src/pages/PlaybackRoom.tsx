import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, FastForward, RotateCcw, ArrowLeft, Terminal, Cpu, Clock, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '../services/api';

interface PlaybackEvent {
  id: string;
  user: string;
  eventType: string;
  payload: {
    content?: string;
    language?: string;
    version?: number;
  };
  timestampOffsetMs: number;
  recordedAt: string;
}

const PlaybackRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<PlaybackEvent[]>([]);
  const [roomDetails, setRoomDetails] = useState({ name: 'Playback Session', creator: 'SeniorDev' });

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [maxOffset, setMaxOffset] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activeCode, setActiveCode] = useState<string>('# No operations recorded yet.');
  const [activeLanguage, setActiveLanguage] = useState<string>('python');
  const [activeUser, setActiveUser] = useState<string>('System');

  const editorRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // Fetch session history playbacks
  const loadPlaybackHistory = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      // Load room metadata
      try {
        const roomRes = await api.get(`/rooms/${roomCode}`);
        setRoomDetails({ name: roomRes.data.name, creator: roomRes.data.creatorName });
      } catch (e) {
        // Fallback for mocks
        setRoomDetails({ name: 'System Design Mock Replay', creator: 'SeniorDev' });
      }

      const res = await api.get(`/rooms/${roomCode}/playback`);
      const rawEvents = res.data;

      // Parse payload and filter code edits
      const parsedEvents: PlaybackEvent[] = rawEvents
        .map((evt: any) => {
          let parsedPayload = {};
          try {
            parsedPayload = JSON.parse(evt.payload);
          } catch (e) {
            parsedPayload = { content: evt.payload };
          }
          return {
            ...evt,
            payload: parsedPayload,
          };
        })
        .filter((evt: PlaybackEvent) => evt.eventType === 'CODE_EDIT' || evt.eventType === 'DRAW');

      setEvents(parsedEvents);

      if (parsedEvents.length > 0) {
        const maxTime = Math.max(...parsedEvents.map(e => e.timestampOffsetMs));
        setMaxOffset(maxTime || 1000);
        
        // Setup initial workspace state
        const firstCodeEvent = parsedEvents.find(e => e.payload.content !== undefined);
        if (firstCodeEvent) {
          setActiveCode(firstCodeEvent.payload.content || '');
          setActiveLanguage(firstCodeEvent.payload.language || 'python');
          setActiveUser(firstCodeEvent.user);
        }
      } else {
        setMaxOffset(1000);
      }
    } catch (err) {
      // Dev mock playbacks setup
      setRoomDetails({ name: 'LeetCode Collab Audit Replay', creator: 'MockDev' });
      const mockEvents: PlaybackEvent[] = [
        {
          id: '1',
          user: 'MockDev',
          eventType: 'CODE_EDIT',
          timestampOffsetMs: 100,
          recordedAt: new Date().toISOString(),
          payload: { content: '# Initializing code\ndef solve():\n    pass', language: 'python' }
        },
        {
          id: '2',
          user: 'Candidate',
          eventType: 'CODE_EDIT',
          timestampOffsetMs: 3000,
          recordedAt: new Date().toISOString(),
          payload: { content: '# Initializing code\ndef solve():\n    return "solved!"', language: 'python' }
        },
        {
          id: '3',
          user: 'SeniorDev',
          eventType: 'CODE_EDIT',
          timestampOffsetMs: 6500,
          recordedAt: new Date().toISOString(),
          payload: { content: '# Initializing code\ndef solve():\n    # Optimized approach\n    print("Reviewing solution...")\n    return "solved!"', language: 'python' }
        }
      ];
      setEvents(mockEvents);
      setMaxOffset(8000);
      setActiveCode(mockEvents[0].payload.content || '');
      setActiveLanguage(mockEvents[0].payload.language || 'python');
      setActiveUser(mockEvents[0].user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaybackHistory();
    return () => stopLoop();
  }, [roomCode]);

  // Apply state matching current timestamp offset
  const applyTimelineState = (timeOffset: number) => {
    if (events.length === 0) return;
    
    // Find the latest code edit event that happened at or before this timeOffset
    const pastEvents = events.filter(e => e.timestampOffsetMs <= timeOffset && e.payload.content !== undefined);
    
    if (pastEvents.length > 0) {
      // Get the latest one
      const latest = pastEvents[pastEvents.length - 1];
      setActiveCode(latest.payload.content || '');
      setActiveLanguage(latest.payload.language || 'python');
      setActiveUser(latest.user);
    }
  };

  const startLoop = () => {
    if (intervalRef.current) return;
    setIsPlaying(true);
    const stepMs = 100; // interval granularity

    intervalRef.current = setInterval(() => {
      setCurrentOffset(prev => {
        const next = prev + stepMs * speedMultiplier;
        if (next >= maxOffset) {
          stopLoop();
          return maxOffset;
        }
        applyTimelineState(next);
        return next;
      });
    }, stepMs);
  };

  const stopLoop = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopLoop();
    } else {
      if (currentOffset >= maxOffset) {
        // Reset slider to beginning if reached end
        setCurrentOffset(0);
        applyTimelineState(0);
      }
      startLoop();
    }
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCurrentOffset(value);
    applyTimelineState(value);
  };

  const handleReset = () => {
    stopLoop();
    setCurrentOffset(0);
    applyTimelineState(0);
  };

  const changeSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const currentIndex = speeds.indexOf(speedMultiplier);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeedMultiplier(nextSpeed);

    // If currently running, restart timer to capture updated speed multiplier
    if (isPlaying) {
      stopLoop();
      setIsPlaying(true);
      const stepMs = 100;
      intervalRef.current = setInterval(() => {
        setCurrentOffset(prev => {
          const next = prev + stepMs * nextSpeed;
          if (next >= maxOffset) {
            stopLoop();
            return maxOffset;
          }
          applyTimelineState(next);
          return next;
        });
      }, stepMs);
    }
  };

  // Convert time durations to human readable formats
  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-screen bg-dark-900">
        <Loader2 className="w-12 h-12 text-brand-purple animate-spin" />
        <span className="text-zinc-500 font-mono text-sm mt-4">Parsing Audit Scrub logs...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-dark-900 relative">
      {/* Background neon blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-magenta/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header navigations */}
      <header className="glass-panel border-b border-white/5 py-4 px-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-brand-magenta/25 text-brand-magenta border border-brand-magenta/30 tracking-wider">TIME-TRAVEL AUDIT</span>
              <h3 className="font-mono text-base font-black text-white">{roomDetails.name}</h3>
            </div>
            <span className="text-xs text-zinc-400 font-sans">Created by {roomDetails.creator} | Room Code: <span className="font-mono text-brand-purple">{roomCode}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-brand-purple" />
            <span className="text-zinc-300 font-bold">{formatDuration(currentOffset)}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-500">{formatDuration(maxOffset)}</span>
          </div>
        </div>
      </header>

      {/* Replay workspace body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left editor container */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative min-h-0 bg-dark-900 border-r border-white/5">
            <Editor
              height="100%"
              language={activeLanguage}
              theme="vs-dark"
              value={activeCode}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                fontSize: 14,
                readOnly: true,
                minimap: { enabled: false },
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                lineNumbersMinChars: 3,
                padding: { top: 12 },
                fontFamily: "Outfit, Fira Code, Courier New"
              }}
            />
          </div>

          {/* Timeline media controllers footer */}
          <div className="glass-panel border-t border-white/5 p-6 flex flex-col gap-4 z-40 bg-dark-950/80 backdrop-blur-xl">
            {/* Seeking slider bar */}
            <div className="flex items-center gap-4 w-full">
              <span className="text-xs font-mono text-zinc-500">{formatDuration(currentOffset)}</span>
              <input 
                type="range"
                min="0"
                max={maxOffset}
                value={currentOffset}
                onChange={handleScrubChange}
                className="flex-1 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-magenta border border-white/5 focus:outline-none"
              />
              <span className="text-xs font-mono text-zinc-500">{formatDuration(maxOffset)}</span>
            </div>

            {/* Mechanics switches buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleReset}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button 
                  onClick={togglePlayback}
                  className={`p-4.5 rounded-2xl transition-all active:scale-95 shadow-lg ${
                    isPlaying 
                      ? 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-brand-purple/15' 
                      : 'bg-brand-magenta hover:bg-brand-magenta/90 text-white shadow-brand-magenta/15'
                  }`}
                  title={isPlaying ? 'Pause Replay' : 'Play Replay'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button 
                  onClick={changeSpeed}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
                  title="Cycle speeds"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  {speedMultiplier}x Speed
                </button>
              </div>

              {/* Operations indicator details */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-zinc-500">Active Typer:</span>
                  <span className="text-brand-blue font-bold">{activeUser}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Cpu className="w-3.5 h-3.5 text-brand-emerald" />
                  <span className="text-zinc-500">Event records count:</span>
                  <span className="text-brand-emerald font-bold">{events.length} logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackRoom;
