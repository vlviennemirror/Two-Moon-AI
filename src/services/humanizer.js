const TYPO_CHARS = {
  'a': 's', 'e': 'r', 'i': 'o', 'o': 'p', 'u': 'i',
  't': 'y', 'n': 'm', 's': 'a', 'r': 'e', 'l': 'k'
};

const SKIP_PATTERNS = [
  /^(ok|okay|k|kk|oke|oki|okok|hmm|hm|mhm)$/i,
  /^(yes|no|ya|yep|nope|nah|yoi|iya|yup)$/i,
  /^(lol|lmao|haha|wkwk|wkwkwk|😂|💀|🔥|👍|👎|xd)$/i,
  /^(nice|cool|bet|aight|damn|dope|sick|based)$/i,
  /^.{1,4}$/,
  /^<a?:\w+:\d+>$/
];

export function shouldSkip(content) {
  const trimmed = content.trim();
  return SKIP_PATTERNS.some(p => p.test(trimmed));
}

export function shouldSplit(content, quirks) {
  if (quirks === 'light') return false;

  const sentences = content.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return false;

  const chance = quirks === 'heavy' ? 0.35 : 0.2;
  return Math.random() < chance;
}

export function splitResponse(content) {
  const parts = [];
  const sentences = content.split(/(?<=[.!?])\s+/);

  if (sentences.length <= 1) return [content];

  let currentPart = '';
  let partCount = 0;

  for (const sentence of sentences) {
    if (partCount >= 3 && Math.random() > 0.15) {
      currentPart += ' ' + sentence;
      continue;
    }

    if (currentPart && Math.random() < (0.4 - partCount * 0.1)) {
      parts.push(currentPart.trim());
      currentPart = sentence;
      partCount++;
    } else {
      currentPart += (currentPart ? ' ' : '') + sentence;
    }
  }

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts.length > 0 ? parts : [content];
}

export function addTypo(text, quirks) {
  if (quirks === 'light' || Math.random() > 0.08) {
    return { text, hasTypo: false };
  }

  const words = text.split(' ');
  if (words.length < 3) return { text, hasTypo: false };

  const idx = Math.floor(Math.random() * words.length);
  const word = words[idx];
  if (word.length < 4) return { text, hasTypo: false };

  const charIdx = Math.floor(Math.random() * (word.length - 1)) + 1;
  const char = word[charIdx].toLowerCase();

  if (TYPO_CHARS[char]) {
    const typoWord = word.substring(0, charIdx) + TYPO_CHARS[char] + word.substring(charIdx + 1);
    words[idx] = typoWord;
    return {
      text: words.join(' '),
      hasTypo: true,
      correction: `*${word}`
    };
  }

  return { text, hasTypo: false };
}

export function calculateDelay(text, sentiment) {
  const baseDelay = 300;
  const perChar = Math.min(text.length * 15, 1500);
  const sentimentMod = sentiment < -0.3 ? -200 : sentiment > 0.3 ? 300 : 0;
  const random = Math.floor(Math.random() * 800);

  return Math.max(400, Math.min(baseDelay + perChar + sentimentMod + random, 3000));
}

export function addFiller(text, quirks) {
  if (quirks === 'light' || Math.random() > 0.25) return text;

  const fillers = ['hmm ', 'oh ', 'ah ', 'eh ', 'uhh ', 'yo ', 'wait '];
  const reactions = ['nice. ', 'damn. ', 'lol. ', 'bruh. ', 'huh. ', 'yo. '];

  if (Math.random() < 0.3) {
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    return filler + text.charAt(0).toLowerCase() + text.slice(1);
  }

  if (Math.random() < 0.2) {
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    return reaction + text.charAt(0).toLowerCase() + text.slice(1);
  }

  return text;
}

export function lowercasify(text) {
  if (Math.random() > 0.7) return text;
  return text.toLowerCase();
}

export default {
  shouldSkip,
  shouldSplit,
  splitResponse,
  addTypo,
  calculateDelay,
  addFiller,
  lowercasify
};
