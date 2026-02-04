import config from '../config.js';
import db from '../database/connection.js';
import groq from '../services/groqClient.js';
import humanizer from '../services/humanizer.js';
const INTEREST_KEYWORDS = {
  gaming: { words: ['valorant', 'minecraft', 'roblox', 'game', 'rank', 'grind', 'noob', 'gg', 'clutch'], weight: 15 },
  drama: { words: ['drama', 'beef', 'toxic', 'cancel', 'expose', 'caught'], weight: 20 },
  food: { words: ['makan', 'lapar', 'food', 'nasi', 'ayam', 'enak', 'hunger'], weight: 10 },
  tech: { words: ['code', 'bug', 'server', 'api', 'error', 'python', 'javascript'], weight: 12 },
  meme: { words: ['meme', 'funny', 'lmao', 'bruh moment', 'based', 'chad'], weight: 8 },
  personal: { words: ['pacar', 'gebetan', 'jadian', 'putus', 'crush', 'love'], weight: 18 }
};
const LURK_CHANCE_BASE = 0.03;
let lastLurkTime = 0;
export function calculateInterest(content, userId, recentActivity) {
  let score = 0;
  const lower = content.toLowerCase();
  for (const [_, data] of Object.entries(INTEREST_KEYWORDS)) {
    const matches = data.words.filter(w => lower.includes(w)).length;
    score += matches * data.weight;
  }
  if (content.length > 50) score += 5;
  if (/[!?]{2,}/.test(content)) score += 8;
  if (recentActivity > 5) score += 10;
  return Math.min(score, 100);
}
export async function shouldLurk(message, recentMessages) {
  if (message.channel.id !== config.server.lurkerChannel) return { lurk: false };
  const now = Date.now();
  const cooldownMs = config.lurker.cooldownMinutes * 60 * 1000;
  if (now - lastLurkTime < cooldownMs) return { lurk: false };
  const recentCount = recentMessages.filter(m => Date.now() - m.timestamp < 60000).length;
  const interest = calculateInterest(message.content, message.author.id, recentCount);
  if (interest < config.lurker.minScore) return { lurk: false };
  const chance = LURK_CHANCE_BASE + (interest - config.lurker.minScore) * 0.01;
  if (Math.random() > chance) return { lurk: false };
  lastLurkTime = now;
  return { lurk: true, interest, topic: detectTopic(message.content) };
}
function detectTopic(content) {
  const lower = content.toLowerCase();
  for (const [topic, data] of Object.entries(INTEREST_KEYWORDS)) {
    if (data.words.some(w => lower.includes(w))) return topic;
  }
  return 'general';
}
export async function generateLurkResponse(message, context, topic) {
  const prompt = `kamu Two Moon, lagi nongkrong di discord. lo baca chat dan mau nimbrung.
Topik: ${topic}
Chat terakhir: "${message.content}"
RULES:
- nimbrung natural, kayak temen yang tiba2 komen
- SINGKAT (max 15 kata)
- jangan sok tau
- boleh random/absurd dikit
- jangan tanya, langsung komen aja`;
  const result = await groq.generate(prompt, `nimbrung ke chat: "${message.content}"`, false, 50);
  if (!result.success) return null;
  return humanizer.lowercasify(result.content);
}
export default { calculateInterest, shouldLurk, generateLurkResponse };
