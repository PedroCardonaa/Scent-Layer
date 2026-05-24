import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) console.warn('[anthropic] ANTHROPIC_API_KEY not set, AI endpoints will return 503');

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
// Default to Sonnet 4.5, cheap + fast + plenty for editorial copy.
// Override via ANTHROPIC_MODEL env var if you want Opus.
// (The previous default `claude-opus-4-7` is not a real model identifier
// and caused every AI endpoint to 404 silently.)
export const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';

/**
 * Call Claude with a forced tool_use schema. Returns the parsed tool input.
 * Throws if the model fails to call the tool, propagating the underlying
 * Anthropic error message so 502/503 responses include the real reason.
 */
export async function structuredCall({ system, user, toolName, schema, maxTokens = 1024 }) {
  if (!anthropic) {
    const err = new Error('AI service not configured, ANTHROPIC_API_KEY missing on the server');
    err.status = 503;
    throw err;
  }
  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      tools: [{ name: toolName, description: `Return the ${toolName} payload.`, input_schema: schema }],
      tool_choice: { type: 'tool', name: toolName },
      messages: [{ role: 'user', content: user }],
    });
  } catch (e) {
    // Surface the actual Anthropic error (bad model, bad key, rate limit,
    // overload, etc.) so the client can show something useful instead of a
    // generic 500. We log the full error server-side too.
    console.error('[anthropic] request failed', { model: MODEL, status: e?.status, message: e?.message });
    const err = new Error(`AI request failed: ${e?.message || 'unknown'}`);
    err.status = e?.status || 502;
    throw err;
  }
  const block = response.content.find(b => b.type === 'tool_use' && b.name === toolName);
  if (!block) {
    const err = new Error('Model did not return structured output');
    err.status = 502;
    throw err;
  }
  return block.input;
}
