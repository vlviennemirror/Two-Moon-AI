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
        sentiment_avg FLOAT DEFAULT 0,
        interaction_count INT DEFAULT 0,
        topics TEXT[],
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
        sentiment FLOAT DEFAULT 0,
        is_bot BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conv_channel 
      ON conversation_cache(channel_id, created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS server_persona (
        server_id TEXT PRIMARY KEY,
        preset TEXT DEFAULT 'twomoon',
        quirk_intensity TEXT DEFAULT 'heavy',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_persona (
        user_id TEXT PRIMARY KEY,
        preset TEXT,
        quirk_intensity TEXT,
        style_sample TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_memory (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        importance INT DEFAULT 5,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memory_user 
      ON bot_memory(user_id, importance DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lurker_state (
        channel_id TEXT PRIMARY KEY,
        last_lurk TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Init error:', error.message);
  } finally {
    client.release();
  }
}

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('[DB] Query error:', error.message);
    return { rows: [] };
  }
}

export async function cleanup(daysOld = 7) {
  try {
    await query(`DELETE FROM conversation_cache WHERE created_at < NOW() - INTERVAL '${daysOld} days'`);
    await query(`DELETE FROM bot_memory WHERE created_at < NOW() - INTERVAL '30 days' AND importance < 7`);
    console.log('[DB] Cleanup completed');
  } catch (error) {
    console.error('[DB] Cleanup error:', error.message);
  }
}

export default { initDatabase, query, cleanup };
