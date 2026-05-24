/**
 * Streaming orchestration: Research Agent → PRD Agent.
 *
 * Runs the two agents in sequence and streams everything to the client as
 * newline-delimited JSON (NDJSON). Each line is one event:
 *   { type: 'stage',    agent }                  // a new agent took the stage
 *   { type: 'thinking', agent, delta }           // streamed reasoning
 *   { type: 'text',     agent, delta }           // streamed output
 *   { type: 'usage',    agent, cacheRead, ... }  // token usage per agent
 *   { type: 'done' }                             // all agents finished
 *   { type: 'error',    message }
 */
import Anthropic from '@anthropic-ai/sdk';

import { MODEL, prdSystem, researchSystem, type AgentId } from '@/lib/agents';

// The Anthropic SDK needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';
export const maxDuration = 120;

const client = new Anthropic();

export async function POST(req: Request) {
  let idea: unknown;
  try {
    ({ idea } = await req.json());
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (typeof idea !== 'string' || idea.trim().length === 0) {
    return Response.json({ error: 'idea is required' }, { status: 400 });
  }
  const productIdea = idea.trim();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

      try {
        // ── Stage 1: Research ──────────────────────────────────────────
        send({ type: 'stage', agent: 'research' });
        const research = await runAgent(send, 'research', researchSystem, [
          { role: 'user', content: `Product idea:\n${productIdea}` },
        ]);

        // ── Stage 2: PRD (reads the cached research context) ────────────
        send({ type: 'stage', agent: 'prd' });
        await runAgent(send, 'prd', prdSystem(productIdea, research), [
          { role: 'user', content: 'Write the MVP PRD now, using the research brief above.' },
        ]);

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

/** Run one agent with streamed thinking + text, return its final text. */
async function runAgent(
  send: (event: Record<string, unknown>) => void,
  agent: AgentId,
  system: string | Anthropic.TextBlockParam[],
  messages: Anthropic.MessageParam[],
): Promise<string> {
  const mstream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    // Adaptive thinking streams the agent's reasoning; "summarized" is required
    // on Opus 4.7 to surface it (default omits the text) — that's the live
    // "watch strategy think itself" effect.
    thinking: { type: 'adaptive', display: 'summarized' },
    output_config: { effort: 'high' },
    system,
    messages,
  });

  for await (const event of mstream) {
    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'thinking_delta') {
        send({ type: 'thinking', agent, delta: event.delta.thinking });
      } else if (event.delta.type === 'text_delta') {
        send({ type: 'text', agent, delta: event.delta.text });
      }
    }
  }

  const final = await mstream.finalMessage();
  const u = final.usage;
  send({
    type: 'usage',
    agent,
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
  });

  return final.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
