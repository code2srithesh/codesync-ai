import React, { useState } from 'react';
import { Send, BrainCircuit, RefreshCw, MessageSquareCode, Award, ShieldAlert, Cpu } from 'lucide-react';
import api from '../services/api';

interface AICopilotProps {
  roomCode: string;
  editorContent: string;
  editorLanguage: string;
}

const AICopilotPanel: React.FC<AICopilotProps> = ({ roomCode, editorContent, editorLanguage }) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [aiOutput, setAiOutput] = useState<string>('### 🤖 Welcome to CodeSync Copilot!\nSelect a quick action below to evaluate your current editor code, or prompt me directly with questions about your implementation.\n\n```python\n# Click any action above to start\n```');
  const [loading, setLoading] = useState<boolean>(false);

  const triggerAIQuery = async (type: string, userInstruction?: string) => {
    if (!editorContent) {
      setAiOutput("### ⚠️ Empty editor content\nPlease write some code in the Monaco Editor before requesting AI assistant evaluations!");
      return;
    }

    setLoading(true);
    setAiOutput("### 🤖 Thinking...\nCodeSync Copilot is parsing your implementation and generating suggestions. Hang tight!");

    try {
      const response = await api.post(`/rooms/${roomCode}/ai-query`, {
        type,
        code: editorContent,
        language: editorLanguage,
        additionalPrompt: userInstruction || ''
      });
      setAiOutput(response.data.response);
    } catch (err) {
      setAiOutput("### ⚠️ Connection Failed\nCould not query the AI Copilot backend service. Verify your server settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    triggerAIQuery('CHAT', userText);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-white/5 rounded-2xl overflow-hidden font-sans">
      
      {/* Side panel title */}
      <div className="px-6 py-4 border-b border-white/5 bg-dark-800/40 flex items-center justify-between">
        <h3 className="font-mono text-sm font-bold tracking-tight text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-brand-purple" /> CodeSync Copilot
        </h3>
        {loading && <RefreshCw className="w-4 h-4 text-brand-purple animate-spin" />}
      </div>

      {/* Quick Actions Grid bar */}
      <div className="p-4 bg-dark-900/60 border-b border-white/5 space-y-3 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">Quick Actions</span>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button 
            onClick={() => triggerAIQuery('CODE_REVIEW')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-magenta" /> Code Review
          </button>
          
          <button 
            onClick={() => triggerAIQuery('COMPLEXITY')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-brand-blue" /> Big-O Math
          </button>

          <button 
            onClick={() => triggerAIQuery('OPTIMIZATION')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-brand-purple" /> Optimize Code
          </button>

          <button 
            onClick={() => triggerAIQuery('HINT')}
            disabled={loading}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5 text-brand-emerald" /> Suggest Hint
          </button>
        </div>
      </div>

      {/* Render AI responses formatted as Markdown snippets */}
      <div className="flex-1 overflow-y-auto p-6 font-sans text-sm text-zinc-300 space-y-4 bg-dark-900 selection:bg-brand-purple/20">
        <div className="prose prose-invert prose-sm max-w-none">
          {aiOutput.split('\n').map((line, idx) => {
            // Very lightweight Markdown parser simulation for layout rendering
            if (line.startsWith('###')) {
              return <h3 key={idx} className="font-mono text-base font-bold text-white tracking-tight mt-4 mb-2 flex items-center gap-1">{line.replace('###', '')}</h3>;
            }
            if (line.startsWith('####')) {
              return <h4 key={idx} className="font-sans text-sm font-bold text-brand-purple mt-3 mb-1.5">{line.replace('####', '')}</h4>;
            }
            if (line.startsWith('*') || line.startsWith('-')) {
              return <li key={idx} className="ml-4 list-disc text-zinc-400 py-0.5">{line.substring(2)}</li>;
            }
            if (line.startsWith('```')) {
              return null; // hide fences in plain rendering
            }
            if (line.trim().length === 0) {
              return <div key={idx} className="h-2" />;
            }
            return <p key={idx} className="leading-relaxed text-zinc-400 py-0.5 font-sans">{line}</p>;
          })}
        </div>
      </div>

      {/* Input chat messaging text box */}
      <div className="p-4 border-t border-white/5 bg-dark-800/20 flex-shrink-0">
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loading}
            placeholder="Ask Copilot anything about this code..."
            className="flex-1 bg-dark-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-purple transition-all duration-300 font-sans disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="p-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICopilotPanel;
