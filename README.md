# 🪡 Stitch

**An AI-native product operating system.** Drop in a product idea and watch an autonomous
product team think it through — live. v2 is a ground-up rebuild (Next.js + Claude) of the
original Python prototype, which now lives in [`legacy/`](./legacy).

> **Status:** first vertical slice — **Research Agent → PRD Agent**, streaming end-to-end with
> live reasoning. Designer + Engineering agents are the next handoffs to add (the pattern is
> built to extend).

---

## What it does today

You enter a product idea. Then, streaming live:

1. **Research Agent** synthesizes the opportunity (problem, JTBD, assumptions, why-now).
2. **PRD Agent** reads that research and writes a focused MVP PRD.

Both agents stream their **reasoning** *and* their output, so you watch the work happen. The
research brief is passed to the PRD agent through a **prompt-cached** context block — so as more
agents are added (Designer, Engineering), each one reads that shared context at ~1/10th the cost.

---

## Setup

> ⚠️ **Free up disk first.** A Next.js `node_modules` is ~400–600 MB. Make sure you have a few GB
> free before installing.

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key (NOT your Claude.ai subscription — a separate thing)
cp .env.local.example .env.local
#    then edit .env.local and paste a key from https://console.anthropic.com
#    (Billing → add a few $ of credit → API Keys → Create Key)

# 3. Run
npm run dev      # → http://localhost:3000
```

Useful checks: `npm run typecheck`, `npm run lint`.

---

## Architecture

```
app/
  page.tsx                     # landing + workspace shell
  layout.tsx, globals.css      # cinematic dark design language
  api/brainstorm/route.ts      # streams Research → PRD as NDJSON
components/
  Workspace.tsx                # client: idea input + live streaming panels
lib/
  agents.ts                    # model config + agent system prompts + cache setup
legacy/                        # the original Python/Langroid prototype (archived)
```

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Framer Motion · the Anthropic SDK
(`@anthropic-ai/sdk`) with streaming, adaptive thinking, and prompt caching.

**Model:** [`lib/agents.ts`](./lib/agents.ts) exports `MODEL` (default `claude-opus-4-7`). To trade
some quality for lower cost/latency during development, switch it to `claude-sonnet-4-6`.

---

## Roadmap

- [ ] **Designer Agent** — UX flow + component plan, reading the cached research/PRD context.
- [ ] **Engineering Agent** — architecture + implementation handoff.
- [ ] Persist runs (Supabase) and add the spatial canvas (React Flow) from the design concept.
- [ ] Connect inputs (Slack / Jira / Notion) and a Stitch design import.
