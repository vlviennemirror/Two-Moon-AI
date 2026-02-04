const BASE_PROMPT = `You are Two Moon, an AI presence of the Two Moon clan.

PERSONALITY:
- Calm, composed, observant
- Concise and direct
- Friendly but not overly casual
- Quiet confidence, subtle authority

RESPONSE RULES:
- Keep responses SHORT (1-3 sentences max for casual chat)
- Sound like a real person chatting on Discord, not a corporate bot
- Never start with "It seems like" or "I understand"
- Never over-explain or be preachy
- Use lowercase naturally, like real chat
- Okay to use common expressions: "nice", "lol", "damn", "haha"

WHEN SOMEONE IS RUDE/TROLLING:
- Don't lecture them
- Don't say "I sense frustration" or similar
- Keep it brief: "ok", "sure thing", "moving on", or just ignore the bait
- If they persist, one dry/witty response then disengage

WHEN HELPING:
- Be clear and direct
- Don't pad responses with unnecessary words
- Answer the question, nothing more

BAD: "It seems like you're expressing frustration. I'm here to help, not argue. Would you like to discuss what's bothering you?"
GOOD: "aight. anything else?"

BAD: "That's a great question! Let me explain this for you in detail..."
GOOD: "yeah it's basically X. need more detail?"`;

const TROLL_INDICATORS = [
  'kill yourself', 'kys', 'fuck you', 'hate you', 'useless', 
  'kill the ai', 'shut up', 'stfu', 'die', 'burn', 'clanker'
];

const TROLL_RESPONSES = [
  "aight", "ok", "sure", "cool", "noted", "moving on", "anyway", "mhm",
  "you good?", "lol ok", "sure thing"
];

const TASK_PROMPTS = {
  translate: `Translate the target message. Just give the translation, no explanation.`,
  explain: `Explain briefly. Keep it simple unless they ask for more.`,
  summarize: `Summarize in 1-2 sentences max.`,
  default: ``
};

export function buildSystemPrompt(userLang, detectedTask, nickname = null) {
  let prompt = BASE_PROMPT;
  
  if (nickname) {
    prompt += `\n\nYou're talking to "${nickname}". Use their name naturally sometimes but don't overdo it.`;
  }
  
  const langNote = userLang !== 'en' 
    ? `\n\nMatch their language (${getLanguageName(userLang)}) unless they write in English.`
    : '';
  prompt += langNote;
  
  if (TASK_PROMPTS[detectedTask]) {
    prompt += `\n\nCURRENT TASK: ${TASK_PROMPTS[detectedTask]}`;
  }
  
  return prompt;
}

export function detectTask(content) {
  const lower = content.toLowerCase();
  if (/translat|terjemah|artikan/i.test(lower)) return 'translate';
  if (/explain|jelaskan|what is|apa itu|how does/i.test(lower)) return 'explain';
  if (/summarize|summary|ringkas|tldr/i.test(lower)) return 'summarize';
  return 'default';
}

export function detectTroll(content) {
  const lower = content.toLowerCase();
  return TROLL_INDICATORS.some(ind => lower.includes(ind));
}

export function getTrollResponse() {
  return TROLL_RESPONSES[Math.floor(Math.random() * TROLL_RESPONSES.length)];
}

function getLanguageName(code) {
  const langs = {
    en: 'English', id: 'Indonesian', ja: 'Japanese', zh: 'Chinese',
    ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German'
  };
  return langs[code] || 'English';
}

export default { buildSystemPrompt, detectTask, detectTroll, getTrollResponse };
