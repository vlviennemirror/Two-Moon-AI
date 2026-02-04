const PREFIXES = ['2M_', 'TM_', '2m_', 'tm_', 'GD_', 'gd_', 'DD_', 'dd_'];

const NICK_MAP = {
  artemis: ['Art', 'Artemis'],
  boomer: ['Boom', 'Boomer'],
  vienna: ['Vi', 'Vienna'],
  phoenix: ['Nix', 'Phoenix'],
  shadow: ['Shad'],
  hunter: ['Hunt'],
  wolf: ['Wolf'],
  dragon: ['Drag'],
  nova: ['Nova'],
  zero: ['Z'],
  scoob: ['Scoob'],
  death: ['Death']
};

export function extract(displayName) {
  let clean = displayName;

  for (const prefix of PREFIXES) {
    if (clean.startsWith(prefix)) {
      clean = clean.slice(prefix.length);
      break;
    }
  }

  clean = clean.replace(/[_\-\.]/g, ' ').trim();
  const lower = clean.toLowerCase();

  for (const [key, nicks] of Object.entries(NICK_MAP)) {
    if (lower.includes(key)) {
      return nicks[Math.floor(Math.random() * nicks.length)];
    }
  }

  if (clean.length <= 4) return clean;

  const parts = clean.split(/\s+/);
  if (parts.length > 1) return parts[0];

  return clean.length > 7 ? clean.slice(0, 4) : clean;
}

export function mention(userId) {
  return `<@${userId}>`;
}

export function shouldMention(context) {
  if (!context.channelHistory || context.channelHistory.length < 3) return false;

  const authors = new Set();
  context.channelHistory.slice(-5).forEach(m => {
    if (!m.isBot) authors.add(m.authorId);
  });

  return authors.size > 1;
}

export default { extract, mention, shouldMention };
