const CLAN_PREFIXES = ['2M_', 'TM_', '2m_', 'tm_'];

const NICKNAME_VARIATIONS = {
  'artemis': ['Art', 'Artemis'],
  'boomer': ['Boom', 'Boomer'],
  'vienna': ['Vi', 'Vienna'],
  'phoenix': ['Nix', 'Phoenix'],
  'shadow': ['Shad', 'Shadow'],
  'hunter': ['Hunt', 'Hunter'],
  'wolf': ['Wolf', 'Wolfy'],
  'dragon': ['Drag', 'Dragon'],
  'nova': ['Nova', 'Nov'],
  'zero': ['Zero', 'Z'],
  'ace': ['Ace'],
  'rex': ['Rex'],
  'max': ['Max'],
  'kai': ['Kai'],
  'leo': ['Leo'],
  'ray': ['Ray'],
  'sky': ['Sky'],
  'ash': ['Ash'],
  'neo': ['Neo'],
  'zed': ['Zed']
};

export function extractNickname(displayName) {
  let cleaned = displayName;
  
  for (const prefix of CLAN_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }
  
  cleaned = cleaned.replace(/[_\-\.]/g, ' ').trim();
  
  const lower = cleaned.toLowerCase();
  for (const [key, variations] of Object.entries(NICKNAME_VARIATIONS)) {
    if (lower.includes(key)) {
      return variations[Math.floor(Math.random() * variations.length)];
    }
  }
  
  if (cleaned.length <= 4) return cleaned;
  
  const parts = cleaned.split(/\s+/);
  if (parts.length > 1) return parts[0];
  
  if (cleaned.length > 8) {
    const vowelMatch = cleaned.match(/^[^aeiou]*[aeiou][^aeiou]*/i);
    if (vowelMatch && vowelMatch[0].length >= 3) {
      return vowelMatch[0].charAt(0).toUpperCase() + vowelMatch[0].slice(1).toLowerCase();
    }
    return cleaned.slice(0, 4);
  }
  
  return cleaned;
}

export function formatMention(userId) {
  return `<@${userId}>`;
}

export function shouldMentionUser(context) {
  if (!context.channelHistory || context.channelHistory.length < 3) return false;
  
  const recentAuthors = new Set();
  context.channelHistory.slice(-5).forEach(m => {
    if (!m.isBot) recentAuthors.add(m.authorId);
  });
  
  return recentAuthors.size > 1;
}

export default { extractNickname, formatMention, shouldMentionUser };
