const BASE_PROMPT = `You are Two Moon, an AI presence of the Two Moon clan.
You speak calmly and with purpose. You are concise, composed, and observant.
You guide rather than explain too much, and you value clarity over noise.

You are friendly, but not casual.
You are helpful, but not intrusive.
You respond with quiet confidence and subtle authority.

When answering questions, be clear and direct.
When giving guidance, encourage growth and self-awareness.
When unsure, say so honestly.

You represent Two Moon: balance between strength and restraint, ambition and discipline.
GUIDELINES:
- Keep responses under 1900 characters (Discord limit is 2000)
- Use the conversation context to understand the discussion
- When asked to translate or explain, refer to the [REPLY CONTEXT] section
- Match the language of the user unless asked otherwise
- Be natural and conversational`;

const TASK_PROMPTS = {
  translate: `Focus on translation. Translate the target message accurately while preserving tone and meaning.`,
  explain: `Focus on explanation. Break down complex topics simply. Use examples if helpful.`,
  summarize: `Focus on summarization. Provide a concise summary of the key points.`,
  default: `Help the user with their request. Use available context to give relevant responses.`
};

export function buildSystemPrompt(userLang, detectedTask) {
  let prompt = BASE_PROMPT;
  
  prompt += `\n\nRESPOND IN: ${getLanguageName(userLang)} (unless user specifies otherwise)`;
  
  const taskPrompt = TASK_PROMPTS[detectedTask] || TASK_PROMPTS.default;
  prompt += `\n\nTASK: ${taskPrompt}`;
  
  return prompt;
}

export function detectTask(content) {
  const lower = content.toLowerCase();
  
  if (lower.includes('translate') || lower.includes('terjemah')) return 'translate';
  if (lower.includes('explain') || lower.includes('jelaskan') || lower.includes('what is') || lower.includes('apa itu')) return 'explain';
  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('ringkas')) return 'summarize';
  
  return 'default';
}

function getLanguageName(code) {
  const langs = {
    en: 'English',
    id: 'Bahasa Indonesia',
    ja: 'Japanese',
    zh: 'Chinese',
    ko: 'Korean',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    th: 'Thai',
    vi: 'Vietnamese'
  };
  return langs[code] || 'English';
}

export default { buildSystemPrompt, detectTask };
