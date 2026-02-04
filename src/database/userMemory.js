import db from './connection.js';
import cache from './cache.js';

export async function getUser(userId) {
  const cached = cache.getUser(userId);
  if (cached) return cached;

  const result = await db.query(
    'SELECT * FROM user_memory WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length > 0) {
    cache.setUser(userId, result.rows[0]);
    return result.rows[0];
  }
  return null;
}

export async function upsertUser(userId, displayName, preferredLang = null) {
  const existing = await getUser(userId);

  if (existing) {
    await db.query(
      `UPDATE user_memory SET 
        display_name = $2,
        preferred_lang = COALESCE($3, preferred_lang),
        interaction_count = interaction_count + 1,
        last_interaction = NOW()
      WHERE user_id = $1`,
      [userId, displayName, preferredLang]
    );
  } else {
    await db.query(
      `INSERT INTO user_memory (user_id, display_name, preferred_lang)
       VALUES ($1, $2, COALESCE($3, 'en'))`,
      [userId, displayName, preferredLang]
    );
  }

  cache.setUser(userId, null);
  return getUser(userId);
}

export async function updateUserSentiment(userId, sentiment) {
  await db.query(
    `UPDATE user_memory SET 
      sentiment_avg = (sentiment_avg * 0.8) + ($2 * 0.2)
    WHERE user_id = $1`,
    [userId, sentiment]
  );
  cache.setUser(userId, null);
}

export async function getUserLang(userId) {
  const user = await getUser(userId);
  return user?.preferred_lang || 'en';
}

export default { getUser, upsertUser, updateUserSentiment, getUserLang };
