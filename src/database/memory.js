import db from './connection.js';
const TOPIC_KEYWORDS = {
  gaming: ['game', 'play', 'steam', 'valorant', 'minecraft', 'roblox', 'rank', 'match'],
  personal: ['feel', 'sad', 'happy', 'love', 'hate', 'friend', 'family', 'girlfriend', 'boyfriend'],
  work: ['work', 'job', 'boss', 'project', 'deadline', 'meeting', 'office'],
  hobby: ['music', 'movie', 'anime', 'art', 'draw', 'cook', 'gym', 'sport'],
  tech: ['code', 'programming', 'python', 'javascript', 'server', 'api', 'bug']
};
function detectTopics(content) {
  const lower = content.toLowerCase();
  const found = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) found.push(topic);
  }
  return found;
}
function calculateImportance(content, sentiment) {
  let score = 5;
  if (content.length > 100) score += 2;
  if (Math.abs(sentiment) > 0.5) score += 2;
  if (/\b(always|never|hate|love|important|serious)\b/i.test(content)) score += 1;
  return Math.min(score, 10);
}
export async function saveMemory(userId, content, sentiment = 0) {
  const topics = detectTopics(content);
  if (topics.length === 0 || content.length < 20) return;
  const importance = calculateImportance(content, sentiment);
  for (const topic of topics) {
    await db.query(`INSERT INTO bot_memory (user_id, topic, content, importance) VALUES ($1, $2, $3, $4)`, [userId, topic, content.substring(0, 500), importance]);
  }
}
export async function recallMemory(userId, currentContent, limit = 3) {
  const topics = detectTopics(currentContent);
  if (topics.length === 0) {
    const result = await db.query(`SELECT content FROM bot_memory WHERE user_id = $1 ORDER BY importance DESC, created_at DESC LIMIT $2`, [userId, limit]);
    return result.rows.map(r => r.content);
  }
  const result = await db.query(`SELECT content FROM bot_memory WHERE user_id = $1 AND topic = ANY($2) ORDER BY importance DESC, created_at DESC LIMIT $3`, [userId, topics, limit]);
  return result.rows.map(r => r.content);
}
export async function updateUserTopics(userId) {
  const result = await db.query(`SELECT topic, COUNT(*) as cnt FROM bot_memory WHERE user_id = $1 GROUP BY topic ORDER BY cnt DESC LIMIT 5`, [userId]);
  const topics = result.rows.map(r => r.topic);
  if (topics.length > 0) {
    await db.query(`UPDATE user_memory SET topics = $2 WHERE user_id = $1`, [userId, topics]);
  }
}
export default { saveMemory, recallMemory, updateUserTopics, detectTopics };
