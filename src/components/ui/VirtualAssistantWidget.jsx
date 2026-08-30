import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ASSISTANT_GREETING } from '../../constants/assistantKnowledge';
import { answerAssistantQuestion, getStarterQuestions } from '../../services/assistantService';
import { normalizeRole } from '../../constants/roleMapping';

function createMessage(role, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    time: new Date().toISOString(),
  };
}

export default function VirtualAssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(() => [
    createMessage('assistant', ASSISTANT_GREETING),
  ]);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const role = normalizeRole(user?.role);
  const starters = getStarterQuestions();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, typing]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  function sendQuestion(questionText) {
    const trimmed = questionText.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, createMessage('user', trimmed)]);
    setInput('');
    setTyping(true);

    window.setTimeout(() => {
      const { answer } = answerAssistantQuestion(trimmed, { role });
      setMessages((prev) => [...prev, createMessage('assistant', answer)]);
      setTyping(false);
    }, 350);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,22rem)] sm:w-96 rounded-2xl border border-emerald-500/30 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-800 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 shrink-0">
                <i className="fas fa-comment-dots text-sm" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">Virtual Assistant</p>
                <p className="text-[11px] text-emerald-100/90 truncate">Community Connect Hub help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Close virtual assistant"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>

          <div ref={listRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    message.role === 'user'
                      ? 'bg-cyber-accent text-slate-950 rounded-br-md'
                      : 'bg-slate-800 text-cyber-text border border-slate-border rounded-bl-md'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-slate-800 border border-slate-border px-3 py-2 text-sm text-cyber-muted">
                  Typing…
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {starters.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendQuestion(question)}
                  className="text-left text-xs rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-100 px-3 py-1.5 hover:bg-emerald-900/50 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-slate-border p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this system…"
                className="cyber-input flex-1 text-sm"
                aria-label="Ask the virtual assistant"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 transition-colors"
                aria-label="Send question"
              >
                <i className="fas fa-paper-plane" aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10px] text-cyber-muted mt-2 leading-snug">
              Answers are based on Community Connect Hub features only.
            </p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2.5 shadow-lg transition-colors"
        aria-expanded={open}
        aria-controls="virtual-assistant-panel"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <i className="fas fa-comment-dots text-sm" aria-hidden="true" />
        </span>
        <span className="font-semibold text-sm">Virtual Assistant</span>
        <span className="text-base leading-none" aria-hidden="true">🦉</span>
      </button>
    </div>
  );
}
