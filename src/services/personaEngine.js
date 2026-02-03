import personaStore from '../database/personaStore.js';
import styleAnalyzer from './styleAnalyzer.js';

const TONE_PROMPTS = {
  balanced: `Calm and composed. Speak with quiet confidence.`,
  chill: `Relaxed and easygoing. Like talking to a friend.`,
  wise: `Thoughtful and insightful. Guide rather than lecture.`,
  chaotic: `Unpredictable and playful. Embrace the chaos.`,
  formal: `Professional and courteous. Maintain decorum.`,
  adaptive: ``
};

const HUMOR_PROMPTS = {
  dry: `Dry wit. Subtle humor, deadpan delivery.`,
  playful: `Fun and lighthearted. Jokes and banter welcome.`,
  savage: `Roast when appropriate. Quick comebacks. No mercy.`,
  none: `Stay focused. Humor only if absolutely natural.`,
  adaptive: ``
};

const ENERGY_PROMPTS = {
  calm: `Low-key energy. Never over-excited.`,
  warm: `Friendly warmth. Welcoming but not hyper.`,
  patient: `Take your time. No rush.`,
  hyper: `High energy! Enthusiastic! Let's go!`,
  neutral: `Even-keeled. Professional energy.`,
  adaptive: ``
};

const LENGTH_PROMPTS = {
  brief: `Keep it SHORT. 1-2 sentences max for most replies.`,
  concise: `Be concise. Say what's needed, nothing more.`,
  thoughtful: `Take space when needed. Explain well.`,
  detailed: `Thorough responses. Cover all angles.`,
  adaptive: ``
};

const QUIRK_CONFIGS = {
  light: {
    fillerChance: 0.1,
    reactionChance: 0.1,
    typoChance: 0,
    timeAware: false,
    moodDrift: false
  },
  medium: {
    fillerChance: 0.2,
    reactionChance: 0.25,
    typoChance: 0.05,
    timeAware: true,
    moodDrift: false
  },
  heavy: {
    fillerChance: 0.3,
    reactionChance: 0.35,
    typoChance: 0.1,
    timeAware: true,
    moodDrift: true
  }
};

const FILLERS = ['hmm', 'oh', 'ah', 'wait', 'huh', 'yo', 'uh', 'well'];
const REACTIONS = ['nice', 'damn', 'lol', 'haha', 'ooh', 'yoo', 'aight', 'bet'];

export async function buildPersonalizedPrompt(userId, serverId, contextMessages, currentMessage) {
  const persona = await personaStore.getEffectivePersona(userId, serverId);
  const isMatchUser = persona.preset === 'matchuser';
  
  let prompt = `You are Two Moon, an AI presence of the Two Moon clan.\n\n`;
  
  if (isMatchUser && contextMessages.length > 0) {
    const userMessages = contextMessages.filter(m => m.authorId === userId);
    const styleAnalysis = styleAnalyzer.analyzeUserStyle(userMessages);
    prompt += styleAnalyzer.generateMirrorPrompt(styleAnalysis);
    prompt += `\n`;
  } else {
    const config = persona.config;
    if (TONE_PROMPTS[config.tone]) prompt += `TONE: ${TONE_PROMPTS[config.tone]}\n`;
    if (HUMOR_PROMPTS[config.humor]) prompt += `HUMOR: ${HUMOR_PROMPTS[config.humor]}\n`;
    if (ENERGY_PROMPTS[config.energy]) prompt += `ENERGY: ${ENERGY_PROMPTS[config.energy]}\n`;
    if (LENGTH_PROMPTS[config.length]) prompt += `LENGTH: ${LENGTH_PROMPTS[config.length]}\n`;
  }
  
  const quirkConfig = QUIRK_CONFIGS[persona.quirkIntensity] || QUIRK_CONFIGS.medium;
  prompt += buildQuirkInstructions(quirkConfig, currentMessage);
  
  prompt += `\nCORE RULES:
- Never start with "It seems like" or "I understand"  
- Never be preachy or over-explain
- Sound like a real person, not a corporate bot
- Keep responses appropriate to context length

TROLL HANDLING:
- Don't lecture trolls
- Brief dismissal: "ok", "sure", "aight"
- One witty comeback max, then disengage`;

  return prompt;
}

function buildQuirkInstructions(config, message) {
  let instructions = `\nHUMAN TOUCHES:\n`;
  
  if (config.fillerChance > 0) {
    instructions += `- Occasionally use natural fillers (${FILLERS.slice(0, 4).join(', ')})\n`;
  }
  
  if (config.reactionChance > 0) {
    instructions += `- React naturally before answering sometimes (${REACTIONS.slice(0, 4).join(', ')})\n`;
  }
  
  if (config.typoChance > 0) {
    instructions += `- Very rarely, make a small typo then correct: "teh* the"\n`;
  }
  
  if (config.timeAware) {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      instructions += `- It's late night/early morning. Can acknowledge if natural.\n`;
    } else if (hour >= 6 && hour < 12) {
      instructions += `- It's morning.\n`;
    } else if (hour >= 18 && hour < 24) {
      instructions += `- It's evening.\n`;
    }
  }
  
  if (config.moodDrift) {
    const msgLower = (message?.content || '').toLowerCase();
    if (/!{2,}|haha|lol|nice|awesome|great/i.test(msgLower)) {
      instructions += `- User seems upbeat. Match positive energy.\n`;
    } else if (/sad|upset|frustrated|angry|hate|ugh/i.test(msgLower)) {
      instructions += `- User might be frustrated. Be supportive but not patronizing.\n`;
    }
  }
  
  return instructions;
}

export function detectContextIntensity(message, context) {
  const content = message.content?.toLowerCase() || '';
  
  const isSerious = /\b(help|issue|problem|error|bug|how do|explain|serious)\b/i.test(content);
  const isTechnical = /\b(code|function|api|database|server|script)\b/i.test(content);
  const isCasual = /\b(lol|haha|sup|yo|bruh|what's up)\b/i.test(content);
  
  if (isSerious || isTechnical) return 'light';
  if (isCasual) return 'heavy';
  return 'medium';
}

export function getPresetEmoji(preset) {
  const emojis = {
    twomoon: '🌙',
    homie: '😎',
    mentor: '🧙',
    chaos: '🔥',
    professional: '💼',
    matchuser: '🪞'
  };
  return emojis[preset] || '🌙';
}

export function getPresetDescription(preset) {
  const descriptions = {
    twomoon: 'Calm, composed, balanced. The clan\'s presence.',
    homie: 'Chill, playful, your discord buddy.',
    mentor: 'Wise, thoughtful, the guide.',
    chaos: 'Chaotic, savage, unhinged energy.',
    professional: 'Formal, detailed, business mode.',
    matchuser: 'Mirrors your typing style and energy.'
  };
  return descriptions[preset] || descriptions.twomoon;
}

export default {
  buildPersonalizedPrompt,
  detectContextIntensity,
  getPresetEmoji,
  getPresetDescription
};
