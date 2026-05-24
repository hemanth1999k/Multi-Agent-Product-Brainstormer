/**
 * Agent roster for Stitch.
 *
 * Each agent is a system prompt + role. The orchestrator (app/api/brainstorm)
 * runs them in sequence, handing each one the previous agent's output. The
 * shared "research context" is cached (see `prdSystem`) so every downstream
 * agent that reads it gets a prompt-cache hit instead of paying full price.
 */
import type Anthropic from '@anthropic-ai/sdk';

/**
 * The model every agent runs on. Defaults to the most capable model.
 * To trade some quality for lower cost/latency during development, switch to
 * 'claude-sonnet-4-6'. (Opus 4.7: $5/$25 per 1M tokens; Sonnet 4.6: $3/$15.)
 */
export const MODEL = 'claude-opus-4-7';

export type AgentId = 'research' | 'prd';

export const AGENT_LABELS: Record<AgentId, string> = {
  research: 'Research Agent',
  prd: 'PRD Agent',
};

/** System prompt for the Research agent — synthesizes the opportunity. */
export const researchSystem =
  `You are the Research Agent in an autonomous product team.\n` +
  `Given a raw product idea, synthesize a crisp research brief that a PM can act on.\n\n` +
  `Produce these sections as clean markdown:\n` +
  `## Problem & Who Has It\n## Jobs To Be Done (top 3)\n## Key Assumptions & Risks\n` +
  `## Opportunity & Why Now\n## Success Signals\n\n` +
  `Be specific and evidence-minded. Prefer concrete user situations over generic statements. ` +
  `No preamble — start directly with the first heading.`;

/** System prompt instructions for the PRD agent. */
const PRD_INSTRUCTIONS =
  `You are the PRD Agent in an autonomous product team.\n` +
  `Using the research brief provided, write a focused MVP product requirements doc.\n\n` +
  `Produce these sections as clean markdown:\n` +
  `## Summary\n## Goals & Non-Goals\n## Target User & Core Use Case\n` +
  `## MVP Scope (must-have user stories with acceptance criteria)\n` +
  `## Out of Scope (v1)\n## Key Metrics\n## Open Questions\n\n` +
  `Keep the MVP genuinely minimal. No preamble — start directly with the first heading.`;

/**
 * Build the PRD agent's system blocks. The idea + research synthesis go in a
 * single block marked `cache_control: ephemeral` — this is the *shared context*
 * the whole downstream team (PRD now; Designer + Engineering next) reads, so
 * caching it means each subsequent agent pays ~0.1x for that prefix instead of
 * full price. The cache is a prefix match, so the stable instructions come
 * first and the per-run research block carries the breakpoint.
 */
export function prdSystem(idea: string, research: string): Anthropic.TextBlockParam[] {
  return [
    { type: 'text', text: PRD_INSTRUCTIONS },
    {
      type: 'text',
      text:
        `# Product idea\n${idea}\n\n` +
        `# Research brief (from the Research Agent)\n${research}`,
      cache_control: { type: 'ephemeral' },
    },
  ];
}
