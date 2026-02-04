const CULTURES = {
  gen_z: ['fr fr', 'no cap', 'lowkey', 'highkey', 'bussin', 'slay', 'bet', 'sus', 'mid', 'ratio', 'ong', 'ngl', 'fr'],
  gamer: ['gg', 'ez', 'noob', 'nerf', 'buff', 'op', 'meta', 'rng', 'carry', 'clutch', 'throw', 'feed', 'diff'],
  weeb: ['nani', 'kawaii', 'sugoi', 'baka', 'senpai', 'desu', 'uwu', 'owo'],
  indo_slang: ['gw', 'gue', 'lu', 'lo', 'anjir', 'bangsat', 'goblok', 'bego', 'cuk', 'wkwk', 'awkwk', 'dong', 'sih', 'deh', 'nih']
};

export function analyze(messages) {
  if (!messages || messages.length === 0) return defaultStyle();

  const combined = messages.map(m => m.content || m).join(' ');
  const lower = combined.toLowerCase();
  const avgLen = combined.length / messages.length;

  const analysis = {
    formality: 'neutral',
    energy: 'medium',
    verbosity: 'normal',
    humor: 'subtle',
    culture: null
  };

  if (/please|thank you|could you|would you|kindly/i.test(combined)) {
    analysis.formality = 'formal';
  } else if (/gw|lu|anjir|lol|bruh|yo|bro|dude/i.test(lower)) {
    analysis.formality = 'casual';
  }

  if (/!{2,}|[A-Z]{4,}|🔥|⚡|💪/.test(combined)) {
    analysis.energy = 'high';
  } else if (avgLen < 15) {
    analysis.energy = 'low';
  }

  if (avgLen > 80) {
    analysis.verbosity = 'verbose';
  } else if (avgLen < 25) {
    analysis.verbosity = 'brief';
  }

  if (/wkwk|haha|lol|lmao|😂|💀|xd/i.test(lower)) {
    analysis.humor = 'playful';
  }

  for (const [culture, words] of Object.entries(CULTURES)) {
    const matches = words.filter(w => lower.includes(w)).length;
    if (matches >= 2) {
      analysis.culture = culture;
      break;
    }
  }

  return analysis;
}

export function toPrompt(style) {
  let p = 'MIRROR USER STYLE:\n';

  if (style.formality === 'casual') {
    p += '- Use casual/slang language\n';
  } else if (style.formality === 'formal') {
    p += '- Be slightly more polite\n';
  }

  if (style.energy === 'high') {
    p += '- High energy, expressive\n';
  } else if (style.energy === 'low') {
    p += '- Chill, minimal responses\n';
  }

  if (style.verbosity === 'brief') {
    p += '- Keep responses very short\n';
  } else if (style.verbosity === 'verbose') {
    p += '- Can be more detailed\n';
  }

  if (style.culture === 'indo_slang') {
    p += '- Use Indo slang (gw, lu, anjir, etc)\n';
  } else if (style.culture === 'gen_z') {
    p += '- Use gen z slang (fr, no cap, bet)\n';
  } else if (style.culture === 'gamer') {
    p += '- Use gaming terms (gg, ez, clutch)\n';
  }

  if (style.humor === 'playful') {
    p += '- Can joke around\n';
  }

  return p;
}

function defaultStyle() {
  return {
    formality: 'casual',
    energy: 'medium',
    verbosity: 'brief',
    humor: 'subtle',
    culture: null
  };
}

export default { analyze, toPrompt };
