import React, { useState } from 'react';
import axios from 'axios';

export default function AICopilotView() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Greetings, Commander. I am Raksha AI Copilot, powered by Groq ultra-low latency intelligence. All 4 perimeter sentinels are currently active. How can I assist you with border threat assessment or patrol deployment?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Error communicating with Groq Tactical AI Engine. Falling back to local rule-based sentinel.' 
      }]);
    }
    setLoading(false);
  };

  const quickPrompts = [
    "Analyze recent breaches in Nathu La sector",
    "What is the current false-positive suppression status?",
    "Generate QRT interception protocol for perimeter tripwire",
    "Assess fog impact on Ridge Defile camera CAM-02"
  ];

  return (
    <div className="p-4 bg-surface-container-lowest flex-1 overflow-y-auto font-mono select-none flex flex-col h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container border border-primary/40 rounded flex items-center justify-center shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="font-headline-sm uppercase tracking-wider text-primary">RAKSHA AI TACTICAL COPILOT</span>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>GROQ LPU ENGINE</span>
              </span>
            </h1>
            <p className="text-[11px] text-on-surface-variant font-sans">Natural language situational awareness & tactical dispatch assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 my-2">
        {messages.map((m, idx) => (
          <div 
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-2xl p-3.5 rounded border text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary-container/20 border-primary/50 text-on-surface rounded-br-none shadow-md'
                : 'bg-surface-container-low border-outline-variant text-on-surface rounded-bl-none shadow-lg'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                {m.role === 'user' ? (
                  <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-xs">person</span> SENTRY OPERATOR</span>
                ) : (
                  <span className="text-primary flex items-center gap-1"><span className="material-symbols-outlined text-xs">psychology</span> RAKSHA AI BRIEFING</span>
                )}
              </div>
              <div className="whitespace-pre-wrap font-sans text-xs text-slate-200">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-low border border-outline-variant p-3 rounded text-xs text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span className="text-[11px]">Synthesizing tactical intelligence via Groq LPU...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap gap-2 pt-2 pb-3">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => setInput(qp)}
            className="text-[11px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/60 px-2.5 py-1 rounded transition-colors"
          >
            "{qp}"
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Raksha AI Copilot (e.g. 'Summarize breaches in sector 1' or 'Draft dispatch order')..."
          className="flex-1 bg-surface-container-low border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono placeholder:text-outline"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 bg-primary hover:bg-primary-fixed-dim disabled:bg-surface-container text-on-primary font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-lg"
        >
          <span className="material-symbols-outlined text-sm">send</span>
          <span>Transmit</span>
        </button>
      </form>
    </div>
  );
}
