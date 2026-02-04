import Sentiment from 'sentiment';

const analyzer = new Sentiment();

const customWords = {
  'lol': 1, 'lmao': 2, 'haha': 2, 'nice': 2, 'cool': 1, 'awesome': 3,
  'hate': -2, 'sucks': -2, 'terrible': -3, 'amazing': 3, 'love': 3,
  'gg': 1, 'ez': 1, 'noob': -1, 'toxic': -2, 'clutch': 2, 'trash': -2,
  'wkwk': 2, 'wkwkwk': 3, 'anjir': -1, 'bangsat': -2, 'goblok': -2,
  'keren': 3, 'mantap': 3, 'asik': 2, 'seru': 2, 'bagus': 2,
  'sedih': -2, 'kesel': -2, 'bete': -2, 'capek': -1, 'males': -1
};

analyzer.registerLanguage('custom', { labels: customWords });

export function analyze(text) {
  const result = analyzer.analyze(text, { language: 'custom' });
  const normalized = Math.max(-1, Math.min(1, result.comparative));

  return {
    score: normalized,
    comparative: result.comparative,
    words: result.words
  };
}

export function getMood(score) {
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
}

export function getResponseStrategy(score) {
  if (score < -0.5) {
    return { delay: 0.5, energy: 'calm', length: 'short', emoji: false };
  }
  if (score > 0.5) {
    return { delay: 1.2, energy: 'match', length: 'normal', emoji: true };
  }
  return { delay: 0.8, energy: 'neutral', length: 'short', emoji: false };
}

export default { analyze, getMood, getResponseStrategy };
