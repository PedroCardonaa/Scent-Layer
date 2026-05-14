import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) console.warn('[anthropic] ANTHROPIC_API_KEY not set — AI endpoints will return 503');

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
export const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7';

/**
 * Call Claude with a forced tool_use schema. Returns the parsed tool input.
 * Throws if the model fails to call the tool.
 */
export async function structuredCall({ system, user, toolName, schema, maxTokens = 1024 }) {
  if (!anthropic) {
    const err = new Error('AI service not configured');
    err.status = 503;
    throw err;
  }
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    tools: [{ name: toolName, description: `Return the ${toolName} payload.`, input_schema: schema }],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: user }],
  });
  const block = response.content.find(b => b.type === 'tool_use' && b.name === toolName);
  if (!block) {
    const err = new Error('Model did not return structured output');
    err.status = 502;
    throw err;
  }
  return block.input;
}
