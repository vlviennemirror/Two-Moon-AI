import db from '../../discord-ai-bot/src/database/connection.js';
import cache from '../../discord-ai-bot/src/database/cache.js';

const PRESETS = {
  twomoon: { tone: 'balanced', humor: 'dry', energy: 'calm', length: 'concise' },
  homie: { tone: 'chill', humor: 'playful', energy: 'warm', length: 'brief' },
  mentor: { tone: 'wise', humor: 'dry', energy: 'patient', length: 'thoughtful' },
  chaos: { tone: 'chaotic', humor: 'savage', energy: 'hyper', length: 'brief' },
  professional: { tone: 'formal', humor: 'none', energy: 'neutral', length: 'detailed' },
  matchuser: { tone: 'adaptive', humor: 'adaptive', energy: 'adaptive', length: 'adaptive' }
};

export function getPresets() {
  return PRESETS;
}

export function getPresetConfig(presetName) {
  return PRESETS[presetName.toLowerCase()] || PRESETS.twomoon;
}

export async function getServerPersona(serverId) {
  const cacheKey = `server_persona_${serverId}`;
  const cached = cache.getUserCache(cacheKey);
  if (cached) return cached;
  
  const result = await db.query('SELECT * FROM server_persona WHERE server_id = $1', [serverId]);
  
  if (result.rows.length > 0) {
    const data = result.rows[0];
    cache.setUserCache(cacheKey, data);
    return data;
  }
  
  return { preset: 'twomoon', quirk_intensity: 'medium' };
}

export async function setServerPersona(serverId, settings) {
  const { preset, tone, humor, energy, length, quirkIntensity } = settings;
  
  await db.query(`
    INSERT INTO server_persona (server_id, preset, custom_tone, custom_humor, custom_energy, custom_length, quirk_intensity, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (server_id) DO UPDATE SET
      preset = COALESCE($2, server_persona.preset),
      custom_tone = COALESCE($3, server_persona.custom_tone),
      custom_humor = COALESCE($4, server_persona.custom_humor),
      custom_energy = COALESCE($5, server_persona.custom_energy),
      custom_length = COALESCE($6, server_persona.custom_length),
      quirk_intensity = COALESCE($7, server_persona.quirk_intensity),
      updated_at = NOW()
  `, [serverId, preset, tone, humor, energy, length, quirkIntensity]);
  
  cache.setUserCache(`server_persona_${serverId}`, null);
}

export async function getUserPersona(userId) {
  const cacheKey = `user_persona_${userId}`;
  const cached = cache.getUserCache(cacheKey);
  if (cached) return cached;
  
  const result = await db.query('SELECT * FROM user_persona WHERE user_id = $1', [userId]);
  
  if (result.rows.length > 0) {
    const data = result.rows[0];
    cache.setUserCache(cacheKey, data);
    return data;
  }
  
  return null;
}

export async function setUserPersona(userId, settings) {
  const { preset, tone, humor, energy, length, quirkIntensity, styleSample } = settings;
  
  await db.query(`
    INSERT INTO user_persona (user_id, preset, custom_tone, custom_humor, custom_energy, custom_length, quirk_intensity, style_sample, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      preset = COALESCE($2, user_persona.preset),
      custom_tone = COALESCE($3, user_persona.custom_tone),
      custom_humor = COALESCE($4, user_persona.custom_humor),
      custom_energy = COALESCE($5, user_persona.custom_energy),
      custom_length = COALESCE($6, user_persona.custom_length),
      quirk_intensity = COALESCE($7, user_persona.quirk_intensity),
      style_sample = COALESCE($8, user_persona.style_sample),
      updated_at = NOW()
  `, [userId, preset, tone, humor, energy, length, quirkIntensity, styleSample]);
  
  cache.setUserCache(`user_persona_${userId}`, null);
}

export async function resetUserPersona(userId) {
  await db.query('DELETE FROM user_persona WHERE user_id = $1', [userId]);
  cache.setUserCache(`user_persona_${userId}`, null);
}

export async function getEffectivePersona(userId, serverId) {
  const userPersona = await getUserPersona(userId);
  const serverPersona = await getServerPersona(serverId);
  
  if (userPersona && userPersona.preset) {
    return {
      source: 'user',
      preset: userPersona.preset,
      config: userPersona.preset === 'matchuser' ? PRESETS.matchuser : {
        tone: userPersona.custom_tone || getPresetConfig(userPersona.preset).tone,
        humor: userPersona.custom_humor || getPresetConfig(userPersona.preset).humor,
        energy: userPersona.custom_energy || getPresetConfig(userPersona.preset).energy,
        length: userPersona.custom_length || getPresetConfig(userPersona.preset).length
      },
      quirkIntensity: userPersona.quirk_intensity || serverPersona.quirk_intensity || 'medium',
      styleSample: userPersona.style_sample
    };
  }
  
  return {
    source: 'server',
    preset: serverPersona.preset || 'twomoon',
    config: getPresetConfig(serverPersona.preset || 'twomoon'),
    quirkIntensity: serverPersona.quirk_intensity || 'medium',
    styleSample: null
  };
}

export default {
  getPresets, getPresetConfig,
  getServerPersona, setServerPersona,
  getUserPersona, setUserPersona, resetUserPersona,
  getEffectivePersona
};
