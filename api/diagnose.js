const { askClaudeForJson } = require('../lib/claude');

const MAX_INSTRUCTION_LENGTH = 20000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { instruction } = req.body || {};
  if (typeof instruction !== 'string' || !instruction.trim()) {
    res.status(400).json({ error: 'instruction is required', code: 'bad_request' });
    return;
  }
  if (instruction.length > MAX_INSTRUCTION_LENGTH) {
    res.status(400).json({ error: 'instruction too long', code: 'prompt_too_large' });
    return;
  }

  try {
    const result = await askClaudeForJson(instruction, { maxTokens: 8000 });
    res.status(200).json(result);
  } catch (err) {
    console.error('diagnose failed:', err);
    const statusByCode = {
      missing_api_key: 500,
      rate_limited: 429,
      invalid_json: 502,
      prompt_too_large: 400,
      server_error: 502,
    };
    const code = err.code || 'server_error';
    res.status(statusByCode[code] || 500).json({ error: err.message || 'diagnose failed', code });
  }
};
