'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { AGENT_LABELS, type AgentId } from '@/lib/agents';

type AgentState = {
  thinking: string;
  text: string;
  usage?: { cacheRead: number; cacheWrite: number; inputTokens: number; outputTokens: number };
};

const EMPTY: Record<AgentId, AgentState> = {
  research: { thinking: '', text: '' },
  prd: { thinking: '', text: '' },
};

const ORDER: AgentId[] = ['research', 'prd'];

export default function Workspace() {
  const [idea, setIdea] = useState('');
  const [agents, setAgents] = useState<Record<AgentId, AgentState>>(EMPTY);
  const [stage, setStage] = useState<AgentId | null>(null);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!idea.trim() || running) return;
    setAgents(structuredClone(EMPTY));
    setError(null);
    setStarted(true);
    setRunning(true);
    setStage(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.json().catch(() => null))?.error ?? `request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line));
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'something went wrong');
      }
    } finally {
      setRunning(false);
      setStage(null);
    }
  }

  function handleEvent(e: Record<string, unknown>) {
    const agent = e.agent as AgentId | undefined;
    switch (e.type) {
      case 'stage':
        if (agent) setStage(agent);
        break;
      case 'thinking':
        if (agent) update(agent, (a) => ({ ...a, thinking: a.thinking + e.delta }));
        break;
      case 'text':
        if (agent) update(agent, (a) => ({ ...a, text: a.text + e.delta }));
        break;
      case 'usage':
        if (agent)
          update(agent, (a) => ({
            ...a,
            usage: {
              cacheRead: Number(e.cacheRead) || 0,
              cacheWrite: Number(e.cacheWrite) || 0,
              inputTokens: Number(e.inputTokens) || 0,
              outputTokens: Number(e.outputTokens) || 0,
            },
          }));
        break;
      case 'error':
        setError(String(e.message ?? 'agent error'));
        break;
    }
  }

  function update(agent: AgentId, fn: (a: AgentState) => AgentState) {
    setAgents((prev) => ({ ...prev, [agent]: fn(prev[agent]) }));
  }

  return (
    <div className="space-y-6">
      {/* Idea composer */}
      <div className="glass-panel p-4">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run();
          }}
          rows={3}
          placeholder="e.g. An AI résumé reviewer that gives job seekers real-time, role-specific feedback"
          className="w-full resize-y rounded-xl bg-transparent px-2 py-1 text-[15px] leading-relaxed text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-neutral-600">⌘/Ctrl + Enter to run</span>
          <button
            onClick={run}
            disabled={running || !idea.trim()}
            className="rounded-lg bg-glow/90 px-4 py-2 text-sm font-medium text-ink shadow-glow transition hover:bg-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? 'Thinking…' : 'Run product team'}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel border-ember/30 p-4 text-sm text-ember">⚠ {error}</div>
      )}

      {/* Agent stream */}
      {started && (
        <div className="space-y-5">
          {ORDER.map((id) => {
            const a = agents[id];
            const isActive = stage === id;
            const isVisible = a.thinking || a.text || isActive;
            if (!isVisible) return null;
            return (
              <AnimatePresence key={id}>
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  className="glass-panel overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? 'animate-breathe bg-glow shadow-glow' : 'bg-sage'
                        }`}
                      />
                      <span className="text-sm font-medium text-neutral-100">
                        {AGENT_LABELS[id]}
                      </span>
                    </div>
                    {a.usage && (
                      <span className="font-mono text-[10px] text-neutral-500">
                        {a.usage.outputTokens} out
                        {a.usage.cacheRead > 0 && ` · ${a.usage.cacheRead} cached`}
                      </span>
                    )}
                  </div>

                  {a.thinking && (
                    <div className="border-b border-hairline bg-black/20 px-5 py-3">
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-600">
                        Reasoning
                      </div>
                      <pre className="scroll-thin max-h-32 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-500">
                        {a.thinking}
                      </pre>
                    </div>
                  )}

                  <div
                    className="md-stream scroll-thin max-h-[60vh] overflow-y-auto px-5 py-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(a.text) }}
                  />
                </motion.section>
              </AnimatePresence>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Minimal, safe markdown → HTML for streamed agent output (escape first). */
function renderMarkdown(md: string): string {
  if (!md) return '<p class="text-neutral-600">…</p>';
  const esc = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      if (/^##\s+/.test(lines[0])) {
        const heading = lines[0].replace(/^##\s+/, '');
        const rest = lines.slice(1).join('\n');
        return `<h2>${inline(heading)}</h2>${rest ? wrapBody(rest) : ''}`;
      }
      return wrapBody(block);
    })
    .join('');
}

function wrapBody(block: string): string {
  const lines = block.split('\n');
  if (lines.every((l) => /^[-*]\s+/.test(l.trim()) || l.trim() === '')) {
    const items = lines
      .filter((l) => l.trim())
      .map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  }
  return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
}

function inline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
