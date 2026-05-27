import { create } from 'zustand';

export interface Participant {
  username: string;
  role: string;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface CollabCursor {
  username: string;
  lineNumber: number;
  column: number;
  color: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'free' | 'rect' | 'circle' | 'line';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface CollabState {
  roomCode: string | null;
  roomName: string | null;
  creatorName: string | null;
  participants: Participant[];
  editorContent: string;
  editorLanguage: string;
  editorVersion: number;
  chatMessages: ChatMessage[];
  whiteboardElements: WhiteboardElement[];
  activeCursors: Record<string, CollabCursor>;
  isMuted: boolean;
  isCameraOff: boolean;
  
  setRoomDetails: (code: string, name: string, creator: string) => void;
  setParticipants: (list: Participant[]) => void;
  setEditorState: (content: string, language: string, version: number) => void;
  setEditorContent: (content: string) => void;
  setEditorLanguage: (language: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  addWhiteboardElement: (elem: WhiteboardElement) => void;
  setWhiteboardElements: (elems: WhiteboardElement[]) => void;
  updateCursor: (userId: string, cursor: CollabCursor) => void;
  removeCursor: (userId: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  resetCollab: () => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  roomCode: null,
  roomName: null,
  creatorName: null,
  participants: [],
  editorContent: '',
  editorLanguage: 'python',
  editorVersion: 0,
  chatMessages: [],
  whiteboardElements: [],
  activeCursors: {},
  isMuted: false,
  isCameraOff: false,

  setRoomDetails: (roomCode, roomName, creatorName) => set({ roomCode, roomName, creatorName }),
  setParticipants: (participants) => set({ participants }),
  setEditorState: (editorContent, editorLanguage, editorVersion) => 
    set({ editorContent, editorLanguage, editorVersion }),
  setEditorContent: (editorContent) => set({ editorContent }),
  setEditorLanguage: (editorLanguage) => set({ editorLanguage }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addWhiteboardElement: (elem) => set((state) => ({ whiteboardElements: [...state.whiteboardElements, elem] })),
  setWhiteboardElements: (whiteboardElements) => set({ whiteboardElements }),
  updateCursor: (userId, cursor) => set((state) => ({
    activeCursors: { ...state.activeCursors, [userId]: cursor }
  })),
  removeCursor: (userId) => set((state) => {
    const next = { ...state.activeCursors };
    delete next[userId];
    return { activeCursors: next };
  }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  resetCollab: () => set({
    roomCode: null,
    roomName: null,
    creatorName: null,
    participants: [],
    editorContent: '',
    editorLanguage: 'python',
    editorVersion: 0,
    chatMessages: [],
    whiteboardElements: [],
    activeCursors: {},
    isMuted: false,
    isCameraOff: false,
  })
}));
