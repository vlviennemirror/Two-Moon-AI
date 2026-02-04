import db from './connection.js';
import cache from './cache.js';

const PRESETS = {
  twomoon: { tone: 'balanced', humor: 'dry', energy: 'calm', length: 'brief' },
  homie: { tone: 'chill', humor: 'playful', energy: 'warm', length: 'brief' },
  mentor: { tone: 'wise', humor: 'dry', energy: 'patient', length: 'normal' },
  chaos: { tone: 'chaotic', humor: 'savage', energy: 'hyper', length: 'brief' },
  professional: { tone: 'formal', humor: 'none', energy: 'neutral', length: 'normal' },
  matchuser: { tone: 'adaptive', humor: 'adaptive', energy: 'adaptive', length: 'adaptive' }
};

export function getPresets() {
  return PRESETS;
}

export function getPresetConfig(name) {
  return PRESETS[name?.toLowerCase()] || PRESETS.twomoon;
}

export async function getServerPersona(serverId) {
  const cacheKey = `server_persona_${serverId}`;
  const cached = cache.getUser(cacheKey);
  if (cached) return cached;

  const result = await db.query(
    'SELECT * FROM server_persona WHERE server_id = $1',
    [serverId]
  );

  const data = result.rows[0] || { preset: 'twomoon', quirk_intensity: 'heavy' };
  cache.setUser(cacheKey, data);
  return data;
}

export async function setServerPersona(serverId, preset, quirks) {
  await db.query(
    `INSERT INTO server_persona (server_id, preset, quirk_intensity, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (server_id) DO UPDATE SET
       preset = $2,
       quirk_intensity = $3,
       updated_at = NOW()`,
    [serverId, preset, quirks]
  );
  cache.setUser(`server_persona_${serverId}`, null);
}

export async function getUserPersona(userId) {
  const cacheKey = `user_persona_${userId}`;
  const cached = cache.getUser(cacheKey);
  if (cached) return cached;

  const result = await db.query(
    'SELECT * FROM user_persona WHERE user_id = $1',
    [userId]
  );

  if (result.rows[0]) {
    cache.setUser(cacheKey, result.rows[0]);
    return result.rows[0];
  }
  return null;
}

export async function setUserPersona(userId, preset, quirks, styleSample) {
  await db.query(
    `INSERT INTO user_persona (user_id, preset, quirk_intensity, style_sample, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       preset = COALESCE($2, user_persona.preset),
       quirk_intensity = COALESCE($3, user_persona.quirk_intensity),
       style_sample = COALESCE($4, user_persona.style_sample),
       updated_at = NOW()`,
    [userId, preset, quirks, styleSample]
  );
  cache.setUser(`user_persona_${userId}`, null);
}

export async function resetUserPersona(userId) {
  await db.query('DELETE FROM user_persona WHERE user_id = $1', [userId]);
  cache.setUser(`user_persona_${userId}`, null);
}

export async function getEffectivePersona(userId, serverId) {
  const userPersona = await getUserPersona(userId);
  const serverPersona = await getServerPersona(serverId);

  if (userPersona && userPersona.preset) {
    return {
      source: 'user',
      preset: userPersona.preset,
      config: getPresetConfig(userPersona.preset),
      quirks: userPersona.quirk_intensity || serverPersona.quirk_intensity || 'heavy',
      styleSample: userPersona.style_sample
    };
  }

  return {
    source: 'server',
    preset: serverPersona.preset || 'twomoon',
    config: getPresetConfig(serverPersona.preset),
    quirks: serverPersona.quirk_intensity || 'heavy',
    styleSample: null
  };
}

export default {
  getPresets,
  getPresetConfig,
  getServerPersona,
  setServerPersona,
  getUserPersona,
  setUserPersona,
  resetUserPersona,
  getEffectivePersona
};
