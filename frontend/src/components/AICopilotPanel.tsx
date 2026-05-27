import React, { useState } from 'react';
import { Send, BrainCircuit, RefreshCw, MessageSquareCode, Award, ShieldAlert, Cpu, Copy, Check, CornerDownLeft } from 'lucide-react';
import api from '../services/api';

interface AICopilotProps {
  roomCode: string;
  editorContent: string;
  editorLanguage: string;
  onInjectCode?: (code: string) => void;
}

// ---------------------------------------------------------------------------
// SYNTAX HIGHLIGHTER UTILITY
// ---------------------------------------------------------------------------
const highlightSyntax = (code: string, _language: string) => {
  // Escaping HTML characters to prevent XSS and malformed tags
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  return lines.map((line, idx) => {
    let coloredLine = line;

    // Highlight strings
    coloredLine = coloredLine.replace(/(["'`])(.*?)\1/g, '<span class="text-brand-emerald">$1$2$1</span>');

    // Highlight comments
    coloredLine = coloredLine.replace(/(\/\/.*|#.*)/g, '<span class="text-zinc-500 italic">$1</span>');

    // Highlight keywords
    const keywordRegex = /\b(def|class|return|import|from|const|let|var|function|public|private|protected|void|static|new|if|else|for|while|try|catch|throw|export|default|interface|type|async|await|package)\b/g;
    coloredLine = coloredLine.replace(keywordRegex, '<span class="text-brand-purple font-semibold">$1</span>');

    // Highlight types & common library utilities
    const builtinRegex = /\b(print|console|log|System|out|println|cout|cin|String|int|double|float|boolean|bool|char|Map|List|Set|HashMap|ArrayList)\b/g;
    coloredLine = coloredLine.replace(builtinRegex, '<span class="text-brand-blue font-bold">$1</span>');

    return (
      <div key={idx} className="min-h-[1.2rem] font-mono leading-relaxed select-text" dangerouslySetInnerHTML={{ __html: coloredLine }} />
    );
  });
};

// ---------------------------------------------------------------------------
// PARSE MARKDOWN SEGMENTS INTO BLOCKS
// ---------------------------------------------------------------------------
interface MarkdownBlock {
  type: 'code' | 'text';
  language?: string;
  content: string;
}

const parseMarkdownBlocks = (text: string): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = [];
  const lines = text.split('\n');
  let currentBlock: string[] = [];
  let isInsideCode = false;
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (isInsideCode) {
        // Close code block
        blocks.push({
          type: 'code',
          language: codeLang,
          content: currentBlock.join('\n')
        });
        currentBlock = [];
        isInsideCode = false;
        codeLang = '';
      } else {
        // Close current text block if it has content
        if (currentBlock.length > 0) {
          blocks.push({
            type: 'text',
            content: currentBlock.join('\n')
          });
          currentBlock = [];
        }
        // Start code block
        isInsideCode = true;
        codeLang = line.trim().substring(3).trim();
      }
    } else {
      currentBlock.push(line);
    }
  }

  // Push residual block
  if (currentBlock.length > 0) {
    blocks.push({
      type: isInsideCode ? 'code' : 'text',
      language: isInsideCode ? codeLang : undefined,
      content: currentBlock.join('\n')
    });
  }

  return blocks;
};

// ---------------------------------------------------------------------------
// RENDER INLINE MARKDOWN ELEMENTS
// ---------------------------------------------------------------------------
const parseInlineStyles = (text: string): React.ReactNode[] => {
  // Regex to match inline code (`code`) and bold (**text**)
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="mx-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs text-brand-magenta font-semibold tracking-tight shadow-sm select-text">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// ---------------------------------------------------------------------------
// INTERACTIVE CODE CARD COMPONENT
// ---------------------------------------------------------------------------
interface CodeCardProps {
  code: string;
  language: string;
  onInject?: (code: string) => void;
}

const CodeCard: React.FC<CodeCardProps> = ({ code, language, onInject }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-white/10 bg-[#070709]/90 backdrop-blur-md overflow-hidden shadow-xl animate-fade-in group">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider select-none">
        <span>{language || 'code'}</span>
        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleCopy}
            type="button"
            className="p-1 px-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 text-[10px] font-mono"
            title="Copy snippet"
          >
            {copied ? <Check className="w-3 h-3 text-brand-emerald animate-pulse" /> : <Copy className="w-3 h-3 text-brand-purple" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {onInject && (
            <button 
              onClick={() => onInject(code)}
              type="button"
              className="p-1 px-2 bg-brand-purple/20 hover:bg-brand-purple text-white rounded border border-brand-purple/30 hover:border-transparent flex items-center gap-1.5 transition-all active:scale-95 text-[10px] font-mono font-bold"
              title="Insert code into editor"
            >
              <CornerDownLeft className="w-3 h-3 text-brand-magenta" />
              Inject to Editor
            </button>
          )}
        </div>
      </div>
      {/* Body panel with keyword syntax highlighting */}
      <pre className="p-4 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed text-zinc-300 select-text max-h-[300px] overflow-y-auto bg-dark-900/40">
        <code>{highlightSyntax(code, language)}</code>
      </pre>
    </div>
  );
};

// ---------------------------------------------------------------------------
// RICH MARKDOWN RENDERER COMPONENT
// ---------------------------------------------------------------------------
interface RichMarkdownRendererProps {
  content: string;
  onInject?: (code: string) => void;
}

const RichMarkdownRenderer: React.FC<RichMarkdownRendererProps> = ({ content, onInject }) => {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-4 font-sans text-sm text-zinc-300 select-text">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <CodeCard 
              key={bIdx} 
              code={block.content} 
              language={block.language || 'code'} 
              onInject={onInject} 
            />
          );
        }

        const lines = block.content.split('\n');
        return (
          <div key={bIdx} className="space-y-2 select-text">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1.5" />;
              }

              // Heading 3
              if (trimmed.startsWith('###')) {
                const headerText = trimmed.replace(/^###\s*/, '');
                return (
                  <h3 key={lIdx} className="font-mono text-sm font-black text-white tracking-wider uppercase mt-5 mb-2 flex items-center gap-2 border-b border-white/5 pb-1 select-none">
                    <span className="w-1.5 h-1.5 bg-brand-purple rounded-full inline-block animate-pulse-glow" />
                    {parseInlineStyles(headerText)}
                  </h3>
                );
              }

              // Heading 4
              if (trimmed.startsWith('####')) {
                const headerText = trimmed.replace(/^####\s*/, '');
                return (
                  <h4 key={lIdx} className="font-sans text-xs font-black text-brand-purple tracking-wider uppercase mt-4 mb-1 border-l-2 border-brand-purple/30 pl-2 select-none">
                    {parseInlineStyles(headerText)}
                  </h4>
                );
              }

              // Heading 2
              if (trimmed.startsWith('##')) {
                const headerText = trimmed.replace(/^##\s*/, '');
                return (
                  <h2 key={lIdx} className="font-mono text-base font-extrabold text-white tracking-tight mt-6 mb-3 border-b border-white/10 pb-2 select-none">
                    {parseInlineStyles(headerText)}
                  </h2>
                );
              }

              // Alert panels: check for custom warnings (🔴, 🟡, 🟢)
              if (trimmed.startsWith('🔴') || trimmed.startsWith('🟡') || trimmed.startsWith('🟢') || trimmed.startsWith('⚠️')) {
                let borderColor = 'border-red-500/20';
                let bgColor = 'bg-red-500/5';
                let emoji = trimmed.substring(0, 2);
                let contentText = trimmed.substring(2).trim();

                if (trimmed.startsWith('🟡') || trimmed.startsWith('⚠️')) {
                  borderColor = 'border-amber-500/20';
                  bgColor = 'bg-amber-500/5';
                  emoji = trimmed.substring(0, trimmed.startsWith('⚠️') ? 1 : 2);
                  contentText = trimmed.substring(trimmed.startsWith('⚠️') ? 1 : 2).trim();
                } else if (trimmed.startsWith('🟢')) {
                  borderColor = 'border-emerald-500/20';
                  bgColor = 'bg-emerald-500/5';
                }

                return (
                  <div key={lIdx} className={`my-4 p-4 rounded-xl border ${borderColor} ${bgColor} flex items-start gap-3 backdrop-blur-sm shadow-sm animate-fade-in`}>
                    <span className="text-base select-none mt-0.5">{emoji}</span>
                    <div className="flex-1 text-xs text-zinc-300 font-sans leading-relaxed select-text">
                      {parseInlineStyles(contentText)}
                    </div>
                  </div>
                );
              }

              // Unordered list items
              if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                const itemText = trimmed.replace(/^[*+-]\s*/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 ml-2 py-0.5 text-zinc-300 leading-relaxed font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2 flex-shrink-0" />
                    <span className="select-text">{parseInlineStyles(itemText)}</span>
                  </div>
                );
              }

              // Numbered list items
              if (/^\d+\.\s+/.test(trimmed)) {
                const num = trimmed.match(/^\d+/)?.[0];
                const itemText = trimmed.replace(/^\d+\.\s*/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-2 py-0.5 text-zinc-300 leading-relaxed font-sans">
                    <span className="font-mono text-brand-purple font-extrabold text-xs mt-0.5 flex-shrink-0 w-4 select-none">{num}.</span>
                    <span className="select-text">{parseInlineStyles(itemText)}</span>
                  </div>
                );
              }

              // General Paragraph
              return (
                <p key={lIdx} className="leading-relaxed text-zinc-400 py-0.5 font-sans select-text">
                  {parseInlineStyles(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MAIN PANEL EXPORT
// ---------------------------------------------------------------------------
const AICopilotPanel: React.FC<AICopilotProps> = ({ roomCode, editorContent, editorLanguage, onInjectCode }) => {
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
            type="button"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-magenta" /> Code Review
          </button>
          
          <button 
            onClick={() => triggerAIQuery('COMPLEXITY')}
            disabled={loading}
            type="button"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-brand-blue" /> Big-O Math
          </button>

          <button 
            onClick={() => triggerAIQuery('OPTIMIZATION')}
            disabled={loading}
            type="button"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-brand-purple" /> Optimize Code
          </button>

          <button 
            onClick={() => triggerAIQuery('HINT')}
            disabled={loading}
            type="button"
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-brand-purple/10 border border-white/5 hover:border-brand-purple/20 text-zinc-300 hover:text-white transition-all text-left font-semibold disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5 text-brand-emerald" /> Suggest Hint
          </button>
        </div>
      </div>

      {/* Render AI responses formatted as Markdown snippets */}
      <div className="flex-1 overflow-y-auto p-6 font-sans text-sm text-zinc-300 bg-dark-900 selection:bg-brand-purple/20">
        <RichMarkdownRenderer content={aiOutput} onInject={onInjectCode} />
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
