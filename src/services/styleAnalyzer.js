const STYLE_MARKERS = {
  formal: {
    patterns: [/\bplease\b/i, /\bthank you\b/i, /\bwould you\b/i, /\bcould you\b/i, /\bkindly\b/i],
    indicators: ['proper punctuation', 'full sentences', 'no slang']
  },
  casual: {
    patterns: [/\blol\b/i, /\blmao\b/i, /\bhaha\b/i, /\bbruh\b/i, /\bdude\b/i, /\bbro\b/i, /\byall\b/i, /\bwanna\b/i, /\bgonna\b/i],
    indicators: ['slang', 'abbreviations', 'lowercase']
  },
  energetic: {
    patterns: [/!{2,}/, /[A-Z]{3,}/, /🔥|💪|🎉|😂|💀|⚡/],
    indicators: ['caps', 'multiple exclamations', 'emojis']
  },
  minimal: {
    patterns: [/^.{1,15}$/, /^(ok|yes|no|sure|yeah|nah|idk|k)$/i],
    indicators: ['short messages', 'single words']
  },
  expressive: {
    patterns: [/\b(omg|wtf|holy|damn|wow|insane|crazy|amazing)\b/i],
    indicators: ['exclamations', 'reactions']
  }
};

const LANGUAGE_PATTERNS = {
  gen_z: ['fr fr', 'no cap', 'lowkey', 'highkey', 'bussin', 'slay', 'bet', 'sus', 'mid', 'W', 'L', 'ratio'],
  gamer: ['gg', 'ez', 'noob', 'nerf', 'buff', 'op', 'meta', 'rng', 'carry', 'clutch', 'throw'],
  weeb: ['nani', 'kawaii', 'sugoi', 'baka', 'senpai', 'desu', 'uwu', 'owo'],
  professional: ['regarding', 'furthermore', 'therefore', 'accordingly', 'subsequently']
};

export function analyzeUserStyle(messages) {
  if (!messages || messages.length === 0) return getDefaultStyle();
  
  const combined = messages.map(m => m.content || m).join(' ');
  const msgCount = messages.length;
  
  const analysis = {
    formality: 0,
    energy: 0,
    verbosity: 0,
    humor: 0,
    subculture: null,
    patterns: []
  };
  
  let formalScore = 0, casualScore = 0;
  STYLE_MARKERS.formal.patterns.forEach(p => { if (p.test(combined)) formalScore++; });
  STYLE_MARKERS.casual.patterns.forEach(p => { if (p.test(combined)) casualScore++; });
  analysis.formality = formalScore > casualScore ? 'formal' : casualScore > formalScore ? 'casual' : 'neutral';
  
  let energyScore = 0;
  STYLE_MARKERS.energetic.patterns.forEach(p => { if (p.test(combined)) energyScore++; });
  STYLE_MARKERS.minimal.patterns.forEach(p => { if (p.test(combined)) energyScore--; });
  analysis.energy = energyScore > 1 ? 'high' : energyScore < -1 ? 'low' : 'medium';
  
  const avgLength = combined.length / msgCount;
  analysis.verbosity = avgLength > 100 ? 'verbose' : avgLength < 30 ? 'brief' : 'normal';
  
  const lowerCombined = combined.toLowerCase();
  for (const [culture, words] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = words.filter(w => lowerCombined.includes(w.toLowerCase())).length;
    if (matches >= 2) {
      analysis.subculture = culture;
      break;
    }
  }
  
  const emojiCount = (combined.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const hasLaughter = /\b(lol|lmao|haha|😂|💀)\b/i.test(combined);
  analysis.humor = emojiCount > 3 || hasLaughter ? 'playful' : 'subtle';
  
  return analysis;
}

export function generateMirrorPrompt(styleAnalysis) {
  const { formality, energy, verbosity, humor, subculture } = styleAnalysis;
  
  let prompt = `MIRROR USER'S STYLE:\n`;
  
  if (formality === 'formal') {
    prompt += `- Use proper grammar and punctuation\n- Be polite and professional\n`;
  } else if (formality === 'casual') {
    prompt += `- Use lowercase naturally\n- Slang and abbreviations are ok\n- Keep it relaxed\n`;
  }
  
  if (energy === 'high') {
    prompt += `- Match their energy! Be enthusiastic\n- Emojis occasionally ok\n`;
  } else if (energy === 'low') {
    prompt += `- Keep it chill and minimal\n- Short responses\n`;
  }
  
  if (verbosity === 'brief') {
    prompt += `- Very short responses, few words\n`;
  } else if (verbosity === 'verbose') {
    prompt += `- Can be more detailed if needed\n`;
  }
  
  if (subculture === 'gen_z') {
    prompt += `- Can use gen-z slang naturally (no cap, fr, bet)\n`;
  } else if (subculture === 'gamer') {
    prompt += `- Can use gamer terms (gg, ez, clutch)\n`;
  } else if (subculture === 'weeb') {
    prompt += `- Light anime references ok\n`;
  }
  
  if (humor === 'playful') {
    prompt += `- Be fun and playful\n`;
  }
  
  return prompt;
}

function getDefaultStyle() {
  return {
    formality: 'neutral',
    energy: 'medium',
    verbosity: 'normal',
    humor: 'subtle',
    subculture: null
  };
}

export function extractStyleSample(messages, maxMessages = 10) {
  if (!messages || messages.length === 0) return '';
  
  const userMessages = messages
    .filter(m => !m.isBot)
    .slice(-maxMessages)
    .map(m => m.content)
    .join('\n');
  
  return userMessages.substring(0, 500);
}

export default { analyzeUserStyle, generateMirrorPrompt, extractStyleSample };
