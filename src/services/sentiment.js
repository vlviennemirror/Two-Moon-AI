import Sentiment from 'sentiment';

const analyzer = new Sentiment();

const customWords = {
  'lol': 1, 'lmao': 2, 'lmfao': 3, 'rofl': 2, 'kek': 1, 'haha': 1, 'dead': 1, 

  'w': 3, 'based': 3, 'chad': 3, 'goated': 4, 'goat': 4,
  'lit': 3, 'fire': 3, 'clean': 2, 'clutch': 3, 'gg': 1,
  'ez': 2, 'pog': 2, 'poggers': 2, 'fr': 1, 'ong': 1, 
  'valid': 2, 'nice': 2, 'cool': 2, 'dope': 2,

  'l': -3, 'mid': -2, 'cringe': -3, 'cap': -1, 'sus': -1,
  'trash': -3, 'garbage': -3, 'dogwater': -3, 'ass': -2,
  'diff': -2, 'throw': -2, 'inting': -2, 'feeder': -2, 
  'noob': -2, 'bot': -1, 'toxic': -3, 'ratio': -2, 
  'salty': -2, 'mad': -2, 'copium': -1, 'bad': -2
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
