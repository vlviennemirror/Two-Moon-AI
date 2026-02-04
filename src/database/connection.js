import pg from 'pg';
import config from '../config.js';

const pool = new pg.Pool({
  connectionString: config.database.url,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_memory (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        preferred_lang TEXT DEFAULT 'en',
        context_summary TEXT,
        interaction_count INT DEFAULT 0,
        last_interaction TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_cache (
        id SERIAL PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_bot BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conv_channel_time 
      ON conversation_cache(channel_id, created_at DESC)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS server_persona (
        server_id TEXT PRIMARY KEY,
        preset TEXT DEFAULT 'twomoon',
        custom_tone TEXT,
        custom_humor TEXT,
        custom_energy TEXT,
        custom_length TEXT,
        quirk_intensity TEXT DEFAULT 'medium',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_persona (
        user_id TEXT PRIMARY KEY,
        preset TEXT DEFAULT NULL,
        custom_tone TEXT,
        custom_humor TEXT,
        custom_energy TEXT,
        custom_length TEXT,
        quirk_intensity TEXT,
        style_sample TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_id TEXT PRIMARY KEY,
        request_count INT DEFAULT 0,
        window_start TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } finally {
    client.release();
  }
}

export async function query(text, params) {
  return pool.query(text, params);
}

export async function cleanupOldData(daysOld = 7) {
  await query(`DELETE FROM conversation_cache WHERE created_at < NOW() - INTERVAL '${daysOld} days'`);
}

export default { initDatabase, query, cleanupOldData };