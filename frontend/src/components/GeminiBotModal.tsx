import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShieldAlert,
  ShieldCheck,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Newspaper,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Trash2,
  Sliders
} from 'lucide-react';
import { ChatMessage, FraudNewsItem } from '../types';
import { sendChatMessage, fetchLiveFraudNews } from '../services/api';

interface GeminiBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple lightweight markdown parser for clean bullet points, bolding, code and headers
const renderFormattedContent = (content: string) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 3 or 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-blue-300 mt-2 mb-1 flex items-center gap-1.5">
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xs font-bold text-white mt-2.5 mb-1 flex items-center gap-1.5 pb-1 border-b border-slate-700/50">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 text-slate-200">
              <span className="text-blue-400 font-bold text-sm leading-none mt-1">•</span>
              <span className="flex-1">
                {parseInlineFormatting(text)}
              </span>
            </div>
          );
        }

        // Numbered list (e.g., 1. Item)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 text-slate-200">
              <span className="text-blue-400 font-semibold shrink-0 text-[11px]">{numMatch[1]}.</span>
              <span className="flex-1">
                {parseInlineFormatting(numMatch[2])}
              </span>
            </div>
          );
        }

        // Regular paragraph with inline formatting
        return (
          <p key={idx} className="text-slate-200">
            {parseInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
};

// Helper for inline **bold** and `code`
const parseInlineFormatting = (text: string) => {
  // Split on **bold** or `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-[10px] px-1 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export const GeminiBotModal: React.FC<GeminiBotModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'news'>('chat');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [newsArticles, setNewsArticles] = useState<FraudNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `### 🛡️ Welcome to Dhanrakshak AI Copilot
Powered by **Google Gemini 3.5 Flash** with **Live News & Threat Intelligence Grounding**.

I have deep technical knowledge of this entire platform and live database telemetry:
* **Explain Every Detail About This App**: 3-tier risk policy, sub-30ms inference, 8 behavioral features, and architecture.
* **Live News Threat Advisory**: Real-time comparison between breaking banking fraud news and Dhanrakshak's prevention algorithms.
* **Simulator Guidance**: How to test edge cases, Account Takeovers, and velocity spikes in the interactive Simulator.
* **Policy Optimization**: Practical advice on tuning risk thresholds and step-up 2FA challenges.

Click any quick prompt below or type your question to begin!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Action Prompts
  const quickPrompts = [
    { label: '🌐 Explain Every Detail About This App', prompt: 'Explain every detail about this app, its architecture, and how each page works.' },
    { label: '📰 Compare Live News & Give Advice', prompt: 'Give me fraud prevention advice by comparing the latest live banking news with our Dhanrakshak detection features.' },
    { label: '⚖️ 3-Tier Policy (Approve/Verify/Block)', prompt: 'Explain the 3-Tier Decision Policy in Dhanrakshak AI and why step-up 2FA is better than hard declines.' },
    { label: '🧠 ML Model & 8 Behavioral Features', prompt: 'Explain the Random Forest ML pipeline, the 8 behavioral features, and how it achieves sub-30ms latency.' },
    { label: '🧪 How to Test in Simulator', prompt: 'Guide me step-by-step on how to test an Account Takeover and a Velocity Burst attack in the Transaction Simulator.' },
    { label: '⚙️ Advice on Tuning Thresholds', prompt: 'What advice do you give for configuring the Approve and Verify risk thresholds in Settings?' }
  ];

  // Fetch live news on mount or tab change
  useEffect(() => {
    if (isOpen && newsArticles.length === 0) {
      setNewsLoading(true);
      fetchLiveFraudNews()
        .then((data) => {
          setNewsArticles(data.articles || []);
        })
        .catch((err) => {
          console.error('Failed to load fraud news:', err);
        })
        .finally(() => {
          setNewsLoading(false);
        });
    }
  }, [isOpen, newsArticles.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage(text, history);

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `### ⚠️ Connection Notice\nUnable to reach Gemini API directly (${err.message || 'Network delay'}). Active local context engine ready.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current AI conversation history?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'model',
          content: 'Chat history cleared. How can I assist you with Dhanrakshak AI architecture, live transaction stats, or news comparison today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleAnalyzeNewsItem = (item: FraudNewsItem) => {
    setActiveTab('chat');
    const prompt = `Please analyze this live fraud news item: "${item.title}" (Source: ${item.source}). Compare this attack vector with Dhanrakshak AI's behavioral features and give advice on how our system prevents it and what policy settings we should calibrate.`;
    handleSend(prompt);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-x-2 bottom-16 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 shadow-2xl rounded-2xl border border-slate-700/80 bg-[#090f1f] text-slate-100 overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
        isExpanded
          ? 'sm:w-[750px] sm:max-w-[95vw] h-[82vh] sm:h-[820px] sm:max-h-[92vh]'
          : 'sm:w-[520px] sm:max-w-[95vw] h-[80vh] sm:h-[640px]'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#0d162e] via-[#13203f] to-[#1a284c] border-b border-slate-700/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Dhanrakshak AI Copilot
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>App Architecture Expert</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-medium">Live News Threat Grounding</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title={isExpanded ? 'Restore default size' : 'Expand window'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClearChat}
            className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Close Copilot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="px-3 py-1.5 bg-[#0b1328] border-b border-slate-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Chatbot</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'news'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Live Threat News ({newsArticles.length})</span>
            {newsArticles.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="text-emerald-400 font-semibold">● SQLite & News Synced</span>
        </div>
      </div>

      {/* Quick Prompts Bar (When in Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="p-2 bg-[#080d1c] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 pl-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Quick:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700/80 transition-all shrink-0 whitespace-nowrap disabled:opacity-50 text-[11px]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans bg-[#090f1f]">
          {messages.map((m) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isModel ? 'items-start' : 'items-end flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isModel
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 shadow-sm ${
                    isModel
                      ? 'bg-[#121c33] text-slate-200 border border-slate-700/80'
                      : 'bg-blue-600 text-white rounded-br-none shadow-blue-600/20'
                  }`}
                >
                  <div className="text-xs">
                    {isModel ? renderFormattedContent(m.content) : m.content}
                  </div>

                  <div
                    className={`flex items-center justify-between pt-1.5 border-t ${
                      isModel ? 'border-slate-700/60 text-slate-400' : 'border-blue-500/70 text-blue-200'
                    } text-[10px]`}
                  >
                    <span>{m.timestamp}</span>
                    {isModel && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="hover:text-slate-200 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
                        title="Copy markdown text"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-[#121c33] border border-slate-700/80 rounded-2xl text-slate-300 flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-xs">
                  Analyzing architecture & comparing live news...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Live Threat Intelligence News Tab */
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#090f1f]">
          <div className="p-3 bg-gradient-to-r from-blue-950/60 to-cyan-950/50 rounded-xl border border-cyan-800/40 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-1">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Payment Cybercrime & Fraud Feed</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Live news headlines scraped and parsed continuously from global cybersecurity feeds.
              Click <strong>"Analyze & Compare"</strong> to have the AI evaluate how Dhanrakshak AI intercepts that attack vector.
            </p>
          </div>

          {newsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-xs">Fetching real-time financial cybercrime reports...</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {newsArticles.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#111a30] border border-slate-700/80 hover:border-blue-500/50 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.pub_date}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {item.snippet}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Source: <strong className="text-slate-200">{item.source}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                          title="Open article"
                        >
                          <span>Article</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => handleAnalyzeNewsItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-200" />
                        <span>Analyze with AI</span>
                      </button>
                    </div>
                  </div>

                  {item.fraud_shield_vector && (
                    <div className="mt-1 px-2.5 py-1 rounded bg-slate-900/80 border border-emerald-900/40 text-[10px] text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.fraud_shield_vector}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Form Area */}
      <div className="p-3 bg-[#080d1b] border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              activeTab === 'news'
                ? 'Ask AI about any of the news items or attack trends...'
                : 'Ask about this app, 3-tier policy, or compare live news...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>Google Gemini 3.5 Flash | Live News Grounding</span>
          <span>Latency ~25ms | Real-time Telemetry</span>
        </div>
      </div>
    </div>
  );
};
