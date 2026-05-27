import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Code, MessageSquare, Paintbrush, BrainCircuit, Volume2, VolumeX, Video, VideoOff, Copy, Check, ArrowLeft, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useAuthStore } from '../store/useAuthStore';
import { useCollabStore } from '../store/useCollabStore';
import api from '../services/api';

import Whiteboard from '../components/Whiteboard';
import AICopilotPanel from '../components/AICopilotPanel';

const CodingRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    roomName, creatorName, participants, editorContent, editorLanguage, editorVersion, chatMessages, activeCursors,
    setRoomDetails, setParticipants, setEditorState, setEditorContent, setEditorLanguage, addChatMessage, setChatMessages,
    isMuted, isCameraOff, toggleMute, toggleCamera, updateCursor, removeCursor
  } = useCollabStore();

  const [activeTab, setActiveTab] = useState<'editor' | 'whiteboard'>('editor');
  const [showAI, setShowAI] = useState<boolean>(true);
  const [showChat, setShowChat] = useState<boolean>(true);
  
  // Connection states
  const [stompClient, setStompClient] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [roomLoading, setRoomLoading] = useState<boolean>(true);
  
  // Console runner states
  const [runLoading, setRunLoading] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string>('Console idle. Click "Run Code" to execute program.');
  const [consoleStatus, setConsoleStatus] = useState<string>('IDLE');
  
  // Copy link utility
  const [copied, setCopied] = useState<boolean>(false);
  
  // Local chat inputs
  const [chatInput, setChatInput] = useState<string>('');

  // Absolute visual coordinates of collaborator cursors inside Monaco viewports
  const [renderedCursors, setRenderedCursors] = useState<Record<string, { top: number; left: number; height: number; color: string }>>({});

  // WebRTC P2P Streams states & references
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const stompClientRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  // Deterministic user color generator matching standard profiles
  const userColors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const getUsernameColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % userColors.length;
    return userColors[index];
  };

  // WebRTC configurations with standard public Google STUN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Setup a new Peer Connection pipeline
  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Attach local stream tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Exchange ICE candidates through websocket signaling broker
    pc.onicecandidate = (event) => {
      if (event.candidate && stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: `/app/room/${roomCode}/webrtc-signal`,
          body: JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            sender: user?.username
          })
        });
      }
    };

    // Render incoming remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    return pc;
  };

  // Initiate an RTC WebRTC offer handshake
  const initiateRTCCall = async () => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: `/app/room/${roomCode}/webrtc-signal`,
          body: JSON.stringify({
            type: 'offer',
            offer: offer,
            sender: user?.username
          })
        });
      }
    } catch (e) {
      // SDP offer failed
    }
  };

  // Dynamically recalculate Monaco text coordinate offsets to absolute pixel positions
  const updateCursorRenderPositions = () => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const newPositions: Record<string, { top: number; left: number; height: number; color: string }> = {};

    Object.keys(activeCursors).forEach((username) => {
      const cursor = activeCursors[username];
      try {
        const pos = editor.getScrolledVisiblePosition({
          lineNumber: cursor.lineNumber,
          column: cursor.column
        });
        if (pos) {
          newPositions[username] = {
            top: pos.top + 12, // match padding-top inside options
            left: pos.left,
            height: pos.height || 20,
            color: cursor.color
          };
        }
      } catch (e) {
        // Position is off viewport bounds
      }
    });

    setRenderedCursors(newPositions);
  };

  // Recalculate overlays whenever cursors update in Zustand store
  useEffect(() => {
    updateCursorRenderPositions();
  }, [activeCursors]);

  // Initialize room data REST query
  const loadRoom = async () => {
    if (!roomCode) return;
    setRoomLoading(true);
    try {
      const response = await api.get(`/rooms/${roomCode}`);
      const r = response.data;
      setRoomDetails(r.roomCode, r.name, r.creatorName);
      setEditorState(r.activeContent, r.activeLanguage, r.documentVersion);
      
      // Fetch past chat transcript logs
      const chatRes = await api.get(`/rooms/${roomCode}/chat`);
      setChatMessages(chatRes.data);

      // Fetch active participants
      const partRes = await api.get(`/rooms/${roomCode}/participants`);
      setParticipants(partRes.data);
    } catch (err) {
      // Dev mock room initialization
      setRoomDetails(roomCode, 'Pair Programming Lab', 'SeniorDev');
      setEditorState(
        '# Pair Programming Room\n\ndef solution(nums):\n    # Write your program code collaboratively here\n    print("CodeSync AI initialized.")\n    return nums\n',
        'python',
        1
      );
      setParticipants([
        { username: user?.username || 'You', role: 'ROLE_OWNER', joinedAt: new Date().toISOString() },
        { username: 'SeniorDev', role: 'ROLE_INTERVIEWER', joinedAt: new Date().toISOString() }
      ]);
    } finally {
      setRoomLoading(false);
    }
  };

  // Initialize WS SockJS stomp client connection
  const initWebSocket = () => {
    const socket = new SockJS('http://localhost:8080/ws-collab');
    const token = localStorage.getItem('codesync_jwt');

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {
        // WS Debug Logger
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      setStompClient(client);
      stompClientRef.current = client;

      // Broadcast system joining message
      client.publish({
        destination: `/app/room/${roomCode}/chat-send`,
        body: JSON.stringify({
          content: `${user?.username} joined the workspace.`,
          type: 'SYSTEM'
        })
      });

      // Subscribe to operational code edits sync channel
      client.subscribe(`/topic/room/${roomCode}/code`, (message) => {
        const payload = JSON.parse(message.body);
        if (payload.sender !== user?.username) {
          setEditorContent(payload.content);
          if (payload.language) {
            setEditorLanguage(payload.language);
          }
        }
      });

      // Subscribe to real-time cursors channel
      client.subscribe(`/topic/room/${roomCode}/cursors`, (message) => {
        const payload = JSON.parse(message.body);
        if (payload.username !== user?.username) {
          updateCursor(payload.username, {
            username: payload.username,
            lineNumber: payload.lineNumber,
            column: payload.column,
            color: payload.color || '#a855f7'
          });
        }
      });

      // Subscribe to WebRTC P2P voice/video signals broker
      client.subscribe(`/topic/room/${roomCode}/webrtc`, async (message) => {
        const payload = JSON.parse(message.body);
        if (payload.sender === user?.username) return; // ignore self signaling

        if (payload.type === 'offer') {
          const pc = createPeerConnection();
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            client.publish({
              destination: `/app/room/${roomCode}/webrtc-signal`,
              body: JSON.stringify({
                type: 'answer',
                answer: answer,
                sender: user?.username
              })
            });
          } catch (e) {
            // Offer acceptance failed
          }
        } else if (payload.type === 'answer') {
          if (peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            } catch (e) {
              // Answer mapping failed
            }
          }
        } else if (payload.type === 'candidate') {
          if (peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              // Candidate swap failed
            }
          }
        }
      });

      // Subscribe to active participants & chat log additions
      client.subscribe(`/topic/room/${roomCode}/chat`, (message) => {
        const msg = JSON.parse(message.body);
        addChatMessage(msg);

        // Fetch live updated member list when someone joins or leaves
        if (msg.type === 'SYSTEM') {
          api.get(`/rooms/${roomCode}/participants`)
            .then((res) => setParticipants(res.data))
            .catch(() => {});

          // Remove disconnected visual cursor carets
          if (msg.content.includes('left the workspace')) {
            const leavingUsername = msg.content.split(' ')[0];
            removeCursor(leavingUsername);
          }
        }
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.activate();
  };

  useEffect(() => {
    loadRoom();
    initWebSocket();

    return () => {
      // Disconnect connections on leave
      if (stompClientRef.current) {
        stompClientRef.current.publish({
          destination: `/app/room/${roomCode}/chat-send`,
          body: JSON.stringify({
            content: `${user?.username} left the workspace.`,
            type: 'SYSTEM'
          })
        });
        stompClientRef.current.deactivate();
      }

      // Close video stream components
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomCode]);

  // Handle local camera captures and signals dispatching
  const handleToggleCamera = async () => {
    const nextState = !isCameraOff;
    toggleCamera();

    if (!nextState) { // Camera is ON
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted });
        setLocalStream(stream);
        localStreamRef.current = stream;

        if (connected) {
          await initiateRTCCall();
        }
      } catch (err) {
        // Access denied
      }
    } else { // Camera is OFF
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setRemoteStream(null);
    }
  };

  // Mute audio streams inside localized session tracks
  const handleToggleMute = () => {
    const nextState = !isMuted;
    toggleMute();

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setEditorContent(value);

    // Push local edits over websocket broker to peers
    if (stompClientRef.current && connected) {
      stompClientRef.current.publish({
        destination: `/app/room/${roomCode}/code-update`,
        body: JSON.stringify({
          content: value,
          language: editorLanguage,
          version: editorVersion
        })
      });
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setEditorLanguage(lang);

    if (stompClientRef.current && connected) {
      stompClientRef.current.publish({
        destination: `/app/room/${roomCode}/code-update`,
        body: JSON.stringify({
          content: editorContent,
          language: lang,
          version: editorVersion
        })
      });
    }
  };

  const handleRunCode = async () => {
    setRunLoading(true);
    setConsoleStatus('RUNNING');
    setConsoleOutput('Compiling program inside secure un-networked sandbox container...');

    try {
      const response = await api.post(`/rooms/${roomCode}/execute`, {
        language: editorLanguage,
        code: editorContent
      });
      const res = response.data;
      setConsoleOutput(res.output);
      setConsoleStatus(res.status);
    } catch (err) {
      setConsoleOutput("⚠️ Sandbox Executor Connection Error.\nFailed to execute code because docker executor is offline.");
      setConsoleStatus("ERROR");
    } finally {
      setRunLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (stompClientRef.current && connected) {
      stompClientRef.current.publish({
        destination: `/app/room/${roomCode}/chat-send`,
        body: JSON.stringify({
          content: chatInput.trim(),
          type: 'CHAT'
        })
      });
      setChatInput('');
    }
  };

  if (roomLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-brand-purple animate-spin" />
        <span className="text-zinc-500 font-mono text-sm mt-4">Mounting CodeSync Live Workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-dark-900">
      
      {/* Dynamic workspace header */}
      <header className="glass-panel border-b border-white/5 py-3.5 px-6 flex justify-between items-center flex-shrink-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <h3 className="font-mono text-base font-black text-white flex items-center gap-2">
              {roomName} 
              <span className="text-xs font-normal text-zinc-500 font-sans">by {creatorName}</span>
            </h3>
            <span className="text-xs font-mono text-brand-purple select-all">{roomCode}</span>
          </div>
        </div>

        {/* Floating Active Collaborators Avatar heap */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex -space-x-2.5 overflow-hidden">
            {participants.map((p, idx) => {
              const color = getUsernameColor(p.username);
              const initials = p.username.substring(0, 2).toUpperCase();
              return (
                <div 
                  key={idx}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-dark-900 flex items-center justify-center text-xs font-black text-white transition-all duration-300 hover:scale-115 hover:z-10 cursor-pointer shadow-md select-none"
                  style={{ backgroundColor: color }}
                  title={`${p.username} (${p.role.replace('ROLE_', '')})`}
                >
                  {initials}
                </div>
              );
            })}
          </div>
          <span className="text-xs font-mono text-zinc-400 font-bold ml-1.5 p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-ping" />
            {participants.length} online
          </span>
        </div>

        {/* Video Signaling controllers & invitation triggers */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className="glow-btn bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5 text-brand-purple" />}
            {copied ? "Copied!" : "Invite Link"}
          </button>
          
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5">
            <button 
              onClick={handleToggleMute}
              className={`p-2 rounded-lg text-zinc-400 hover:text-white transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : ''}`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleToggleCamera}
              className={`p-2 rounded-lg text-zinc-400 hover:text-white transition-all ${isCameraOff ? 'bg-red-500/20 text-red-400' : ''}`}
              title={isCameraOff ? "Camera On" : "Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace panel split split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left main workspace split */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Workspace category toggles bar */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-white/5 bg-dark-900/60 flex-shrink-0 z-30">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
              <button 
                onClick={() => setActiveTab('editor')}
                className={`py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition-all font-semibold ${
                  activeTab === 'editor' ? 'bg-brand-purple text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" /> Code Editor
              </button>
              
              <button 
                onClick={() => setActiveTab('whiteboard')}
                className={`py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition-all font-semibold ${
                  activeTab === 'whiteboard' ? 'bg-brand-purple text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Paintbrush className="w-4 h-4" /> Draw Whiteboard
              </button>
            </div>

            {/* Language dropdown and execution triggers */}
            {activeTab === 'editor' && (
              <div className="flex items-center gap-3">
                <select 
                  value={editorLanguage}
                  onChange={handleLanguageChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-purple font-mono cursor-pointer"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <button 
                  onClick={handleRunCode}
                  disabled={runLoading}
                  className="bg-brand-emerald hover:bg-brand-emerald/90 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Run Code
                </button>
              </div>
            )}
          </div>

          {/* Core dynamic content viewer */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'editor' ? (
              <div className="flex-1 flex flex-col min-h-0 bg-dark-900">
                {/* Monaco Editor mounted node */}
                <div className="flex-1 relative min-h-0 border-b border-white/5">
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    theme="vs-dark"
                    value={editorContent}
                    onChange={handleEditorChange}
                    onMount={(editor) => { 
                      editorRef.current = editor;

                      // Initial position push
                      editor.onDidFocusEditorWidget(() => {
                        const pos = editor.getPosition();
                        if (pos && stompClientRef.current && connected) {
                          stompClientRef.current.publish({
                            destination: `/app/room/${roomCode}/cursor-update`,
                            body: JSON.stringify({
                              lineNumber: pos.lineNumber,
                              column: pos.column,
                              color: getUsernameColor(user?.username || 'Anonymous')
                            })
                          });
                        }
                      });

                      // Real-time cursor coordinates changes publishing
                      editor.onDidChangeCursorPosition((e: any) => {
                        if (stompClientRef.current && connected) {
                          stompClientRef.current.publish({
                            destination: `/app/room/${roomCode}/cursor-update`,
                            body: JSON.stringify({
                              lineNumber: e.position.lineNumber,
                              column: e.position.column,
                              color: getUsernameColor(user?.username || 'Anonymous')
                            })
                          });
                        }
                      });

                      // Re-align layouts on scrolling/updating viewport text
                      editor.onDidScrollChange(() => {
                        updateCursorRenderPositions();
                      });
                      editor.onDidChangeModelContent(() => {
                        updateCursorRenderPositions();
                      });
                    }}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                      lineNumbersMinChars: 3,
                      padding: { top: 12 },
                      fontFamily: "Outfit, Fira Code, Courier New"
                    }}
                  />

                  {/* Absolute visual float peer cursors */}
                  {Object.keys(renderedCursors).map((username) => {
                    const rCursor = renderedCursors[username];
                    return (
                      <div 
                        key={username}
                        className="collab-cursor-overlay"
                        style={{
                          top: rCursor.top,
                          left: rCursor.left,
                          height: rCursor.height,
                          backgroundColor: rCursor.color,
                        }}
                      >
                        <span 
                          className="collab-cursor-flag font-sans rounded-md text-[9px] shadow-lg border border-white/10"
                          style={{ backgroundColor: rCursor.color }}
                        >
                          {username}
                        </span>
                      </div>
                    );
                  })}

                  {/* Floating WebRTC Camera Feeds Overlay */}
                  {(localStream || remoteStream) && (
                    <div className="absolute bottom-6 left-6 z-30 flex gap-4 pointer-events-none">
                      {localStream && (
                        <div className="w-[150px] h-[100px] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl relative pointer-events-auto">
                          <video 
                            ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-300 font-bold border border-white/5">You (Local)</span>
                        </div>
                      )}

                      {remoteStream && (
                        <div className="w-[150px] h-[100px] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl relative pointer-events-auto animate-fade-in">
                          <video 
                            ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }}
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-brand-purple/65 text-[9px] font-mono text-white font-bold border border-white/5">Collaborator</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Secure execution console terminal */}
                <div className="h-[220px] bg-[#0c0c0e] flex flex-col flex-shrink-0">
                  <div className="px-6 py-2.5 bg-dark-900 border-b border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono font-bold">
                    <span>EXECUTION CONSOLE OUTPUT</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all duration-300 ${
                      consoleStatus === 'SUCCESS' ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' : 
                      consoleStatus === 'TIMEOUT' || consoleStatus === 'COMPILE_ERROR' || consoleStatus === 'ERROR' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                      consoleStatus === 'RUNNING' ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple animate-pulse' : 'bg-white/5 border-transparent text-zinc-500'
                    }`}>{consoleStatus}</span>
                  </div>
                  <div className="flex-1 p-6 font-mono text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                    {consoleOutput}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-6 bg-dark-900 flex flex-col min-h-0">
                <Whiteboard roomCode={roomCode!} stompClient={stompClient} />
              </div>
            )}
          </div>
        </div>

        {/* Right side panels split (Chat and Copilot) */}
        <div className="flex flex-shrink-0 flex-row h-full">
          {/* Chat drawer */}
          {showChat && (
            <div className="w-[320px] bg-dark-900 border-l border-white/5 flex flex-col h-full z-20">
              <div className="px-6 py-4 border-b border-white/5 bg-dark-800/40 flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-purple" /> Chat Workspace
                </h3>
              </div>

              {/* Chat timeline logs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/60 font-sans text-xs">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`space-y-1 ${msg.type === 'SYSTEM' ? 'text-center py-2' : ''}`}>
                    {msg.type === 'SYSTEM' ? (
                      <span className="text-zinc-500 font-mono italic">{msg.content}</span>
                    ) : (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-brand-purple font-bold">{msg.sender}</span>
                          <span className="text-zinc-500">{msg.senderRole.replace('ROLE_', '')}</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-dark-800/20 flex gap-2 flex-shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send chat..."
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-brand-purple font-sans"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl transition-all active:scale-95 text-xs font-bold disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* AI Copilot Panel drawer */}
          {showAI && (
            <div className="w-[360px] bg-dark-900 border-l border-white/5 h-full">
              <AICopilotPanel 
                roomCode={roomCode!}
                editorContent={editorContent}
                editorLanguage={editorLanguage}
              />
            </div>
          )}

          {/* Drawer tabs handles bar */}
          <div className="w-[50px] bg-dark-900 border-l border-white/5 flex flex-col items-center py-6 gap-6 z-30">
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-2.5 rounded-xl border transition-all ${
                showChat ? 'bg-brand-purple border-brand-purple text-white shadow-md' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
              title="Chat Toolbar"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowAI(!showAI)}
              className={`p-2.5 rounded-xl border transition-all ${
                showAI ? 'bg-brand-purple border-brand-purple text-white shadow-md' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
              title="AI Copilot Toolbar"
            >
              <BrainCircuit className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingRoom;
