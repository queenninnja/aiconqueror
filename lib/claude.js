const Anthropic = require('@anthropic-ai/sdk');

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Extracts the first top-level JSON object found in a string.
 * Models sometimes wrap JSON in markdown fences or add a short preamble;
 * this pulls out the { ... } block by bracket matching.
 */
function extractJson(text) {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('no JSON object found in response');
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  throw new Error('unterminated JSON object in response');
}

/**
 * Sends `instruction` to Claude and returns the parsed JSON object the
 * instruction asked for. Throws an Error with a `.code` property that the
 * API route can map to an HTTP status / user-facing message.
 */
async function askClaudeForJson(instruction, { maxTokens = 4096, model = 'claude-sonnet-4-5-20250929' } = {}) {
  const anthropic = getClient();
  if (!anthropic) {
    const err = new Error('ANTHROPIC_API_KEY is not set on the server');
    err.code = 'missing_api_key';
    throw err;
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: instruction + '\n\n重要：JSONオブジェクトのみを出力してください。前置き、後書き、コードフェンス(```)は一切付けないでください。',
        },
      ],
    });
  } catch (e) {
    if (e && e.status === 429) {
      const err = new Error('rate limited by Anthropic API');
      err.code = 'rate_limited';
      throw err;
    }
    const err = new Error(e && e.message ? e.message : 'Anthropic API request failed');
    err.code = 'server_error';
    throw err;
  }

  const textBlock = (response.content || []).find((b) => b.type === 'text');
  const raw = textBlock ? textBlock.text : '';

  if (response.stop_reason === 'max_tokens') {
    const err = new Error('response truncated at max_tokens');
    err.code = 'prompt_too_large';
    throw err;
  }

  let jsonStr;
  try {
    jsonStr = extractJson(raw);
  } catch (e) {
    const err = new Error('could not locate JSON in model response');
    err.code = 'invalid_json';
    throw err;
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const err = new Error('model response was not valid JSON');
    err.code = 'invalid_json';
    throw err;
  }
}

module.exports = { askClaudeForJson };
