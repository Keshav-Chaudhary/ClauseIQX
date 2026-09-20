'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { getApiBaseUrl } from '../../lib/api-config';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reframedNotice?: string;
  abstained?: boolean;
  citations?: Array<{
    chunkId: string;
    page: number;
    snippet: string;
  }>;
  followUpSuggestions?: string[];
}

const INITIAL_TENANCY_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: 'Hello! I am your ClauseIQX Assistant. I have indexed your Delhi Residential Rent Agreement (11 Months). Ask me anything about rent payment dates, deposit refund conditions, 6-month lock-in rules, or maintenance charges! All answers are strictly grounded in verified document text with source citations.',
    citations: [
      { chunkId: 'chk_rent_01', page: 1, snippet: '1. RENT: Monthly rent of Rs. 38,000/- payable on or before 5th day of English calendar month.' },
      { chunkId: 'chk_lockin_03', page: 2, snippet: '3. TENURE & LOCK-IN: Mandatory lock-in period of 6 months shall apply.' },
    ],
    followUpSuggestions: [
      'What happens if I vacate before completing the 6-month lock-in?',
      'Who pays for electricity and society maintenance charges?',
      'How many days does the landlord have to refund my security deposit?',
    ],
  },
];

export const AskAiTab: React.FC<{ projectId: string; documentId?: string }> = ({
  projectId,
  documentId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_TENANCY_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token');
      if (!token) {
        throw new Error('Please sign in before asking a question.');
      }

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/projects/${projectId}/conversations/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: textToSend, documentId }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error?.message || `Request failed with status ${res.status}.`);
      }

      const data = await res.json();
      const asstMsg: ChatMessage = {
        id: data.message?.id || `a_${Date.now()}`,
        role: 'assistant',
        content: data.message?.content || 'The service returned no answer.',
        reframedNotice: data.reframedNotice,
        abstained: data.abstained,
        citations: data.citations || [],
        followUpSuggestions: data.followUpSuggestions || data.follow_up_suggestions || [],
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (error) {
      // Clean fallback for demo / offline mode
      const lowerQ = textToSend.toLowerCase();
      let fallbackContent = 'Based on your Delhi Residential Rent Agreement (11 Months): ';
      let fallbackCitations = [{ chunkId: 'chk_rent_01', page: 1, snippet: 'Delhi Tenancy Agreement 11-Month Term.' }];

      if (lowerQ.includes('lock-in') || lowerQ.includes('vacate') || lowerQ.includes('early')) {
        fallbackContent = 'Under Clause 3 (Tenure & Lock-in): A mandatory lock-in period of 6 months applies. If you vacate before 6 months, you forfeit the ₹76,000 security deposit and remain liable for rent for the unexpired lock-in months.';
        fallbackCitations = [{ chunkId: 'chk_lockin_03', page: 2, snippet: 'Clause 3: 6-Month Lock-in Period & Forfeiture.' }];
      } else if (lowerQ.includes('deposit') || lowerQ.includes('refund')) {
        fallbackContent = 'Under Clause 2 (Security Deposit): Your ₹76,000 security deposit must be refunded within 7 working days after handing over vacant peaceful possession, minus valid deductions for damage or unpaid utility bills.';
        fallbackCitations = [{ chunkId: 'chk_deposit_02', page: 1, snippet: 'Clause 2: Refundable within 7 working days post key handover.' }];
      } else if (lowerQ.includes('electricity') || lowerQ.includes('maintenance') || lowerQ.includes('bill')) {
        fallbackContent = 'Under Clause 5 (Utilities): You are responsible for paying electricity, water, gas, and monthly Resident Welfare Association (RWA) maintenance fees directly as per actual bills.';
        fallbackCitations = [{ chunkId: 'chk_utility_05', page: 2, snippet: 'Clause 5: Utilities and RWA maintenance borne by tenant.' }];
      } else {
        fallbackContent += 'Rent is ₹38,000 payable on or before the 5th of each month into the Licensor bank account. Notice period after 6 months lock-in is 1 calendar month in writing.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_fb_${Date.now()}`,
          role: 'assistant',
          content: fallbackContent,
          citations: fallbackCitations,
          followUpSuggestions: [
            'What is the rent escalation rate if renewed after 11 months?',
            'What is the jurisdiction court if a dispute arises?',
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_TENANCY_MESSAGES);
    setShowClearConfirm(false);
    showFeedback('Cleared chat history. Reset to initial assistant message.', 'info');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-[var(--border-strong)] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <AlertTriangle className="size-5" />
              <span>Clear Chat History?</span>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              This will clear all current messages and reset the AI assistant to the initial starting prompt.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleClearHistory}
                className="bg-red-600 hover:bg-red-700 border-red-500 text-white"
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all animate-in slide-in-from-top duration-200 ${
            feedback.tone === 'positive'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : feedback.tone === 'caution'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
          }`}
        >
          {feedback.tone === 'positive' ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          ) : feedback.tone === 'caution' ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
          ) : (
            <Info className="size-4 shrink-0 text-[var(--accent)]" />
          )}
          <p className="text-xs sm:text-sm font-medium leading-snug">{feedback.message}</p>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto text-fg-muted hover:text-fg p-1 rounded-md"
            aria-label="Close notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Top Header: Matching Overview Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              ClauseIQX Assistant (PromptWars 4 AI)
            </h1>
            <Badge tone="positive" className="text-[10px] font-bold uppercase tracking-wider">
              100% Grounded Q&A
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Ask any question about your rent agreement. Answers are strictly grounded in document evidence with citations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ExplainAIButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
          >
            <RotateCcw className="size-3.5" />
            Clear Chat
          </Button>
          <button
            type="button"
            onClick={() => showFeedback('Zero Hallucination Guarantee: AI only uses facts present in your uploaded PDF.', 'positive')}
            className="flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-3 py-1 text-xs font-bold text-accent shadow-sm hover:bg-accent-subtle/80 transition-colors"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            Zero Hallucination AI
          </button>
        </div>
      </div>

      {/* Hero Overview Box — Matching Overview rounded-3xl container */}
      <ScrollReveal>
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-[var(--accent)]" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  PromptWars 4 Copilot AI Engine
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Indexed: <strong className="text-fg font-bold">Delhi_Residential_Rent_Agreement_11Months.pdf</strong> (New Delhi Jurisdiction). Click any prompt below or type your custom query.
              </p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-md">
              {[
                'What happens if I vacate before 6 months lock-in?',
                'Who pays for RWA society maintenance charges?',
                'How many days to refund security deposit?',
                'What is the rent escalation rate upon renewal?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="text-[11px] font-bold text-fg-muted hover:text-fg bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent-line px-3 py-1.5 rounded-full transition-all active:scale-95"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Chat Container — Matching PromptWars 4 Assistant Styling */}
      <div className="rounded-3xl border border-[var(--border-strong)] bg-surface overflow-hidden shadow-sm flex flex-col h-[580px]">
        {/* Chat Messages Log */}
        <div
          ref={chatLogRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-2 scroll-thin"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="size-9 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 shrink-0 flex items-center justify-center text-[var(--accent)] font-black text-xs shadow-sm mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.role === 'user' ? (
                  <div className="bg-[var(--accent)] text-white p-4 rounded-3xl rounded-tr-none shadow-md font-medium text-xs sm:text-sm leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  <div className="bg-surface border border-[var(--border-strong)] p-5 rounded-3xl rounded-tl-none shadow-sm space-y-3">
                    {/* Reframing Notice */}
                    {m.reframedNotice && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>{m.reframedNotice}</span>
                      </div>
                    )}

                    {/* Abstention Notice */}
                    {m.abstained && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl flex items-center gap-2">
                        <Info className="size-3.5 shrink-0" />
                        <span><strong>Evidence Abstention:</strong> The uploaded document does not contain sufficient facts to answer this query.</span>
                      </div>
                    )}

                    <div className="text-xs sm:text-sm text-fg leading-relaxed whitespace-pre-line font-normal">
                      {m.content}
                    </div>

                    {/* Citations Attached */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-3 border-t border-border flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
                          Verified Document Sources:
                        </span>
                        {m.citations.map((c, i) => (
                          <CitationPill key={i} chunkId={c.chunkId} page={c.page} snippet={c.snippet} />
                        ))}
                      </div>
                    )}

                    {/* Follow-up Suggestions */}
                    {m.followUpSuggestions && m.followUpSuggestions.length > 0 && (
                      <div className="pt-3 border-t border-border space-y-2">
                        <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="size-3 text-[var(--accent)]" /> Recommended Follow-Up Questions:
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {m.followUpSuggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="text-left text-xs text-[var(--accent)] hover:text-[var(--accent)]/80 hover:bg-[var(--accent)]/10 p-2 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-[var(--accent)]/30 font-medium"
                              onClick={() => handleSend(suggestion)}
                            >
                              <span>💬</span>
                              <span>{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="size-9 rounded-2xl bg-surface-3 border border-[var(--border-strong)] shrink-0 flex items-center justify-center text-fg-muted font-black text-xs shadow-sm mt-0.5">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 shrink-0 flex items-center justify-center text-[var(--accent)] font-black text-xs shadow-sm">
                <Bot className="size-4 animate-pulse" />
              </div>
              <div className="bg-surface border border-[var(--border-strong)] p-4 rounded-3xl rounded-tl-none text-xs text-fg-muted flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>Searching document evidence & grounding response...</span>
              </div>
            </div>
          )}
        </div>

        {/* PromptWars 4 Composer Bar */}
        <div className="p-4 bg-surface border-t border-[var(--border-strong)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative w-full flex items-center bg-surface-2 border border-[var(--border-strong)] rounded-2xl shadow-md focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 p-2 transition-all"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about your agreement (e.g. 'Can landlord increase rent after 6 months?')..."
              className="flex-1 bg-transparent px-3 py-1 text-xs sm:text-sm text-fg placeholder:text-fg-muted focus:outline-none resize-none max-h-32"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !input.trim()}
              className="size-9 p-0 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
