import Groq from 'groq-sdk';
import config from '../config.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

export async function generate(systemPrompt, userContext, useSmart = false, maxTokens = null) {
  try {
    const model = useSmart ? config.groq.modelSmart : config.groq.modelFast;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ],
      max_tokens: maxTokens || config.groq.maxTokens,
      temperature: config.groq.temperature,
      top_p: 0.95,
      frequency_penalty: 0.4,
      presence_penalty: 0.3
    });

    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage
    };
  } catch (error) {
    console.error('[Groq] Generate error:', error.message);
    return { success: false, error: error.message, content: null };
  }
}

export async function think(context, question) {
  const prompt = `You are analyzing a Discord conversation to decide how to respond. Think briefly:
1. What is the user's mood/intent?
2. Should you even respond? (if message is just "ok", "lol", emoji - probably not)
3. If responding, what tone fits?

Answer ONLY in JSON format:
{"shouldRespond": true/false, "mood": "string", "strategy": "string", "responseType": "short|medium|ignore"}`;

  const result = await generate(prompt, context, false, 100);
  if (!result.success) {
    return { shouldRespond: true, mood: 'neutral', strategy: 'default', responseType: 'short' };
  }

  try {
    const cleaned = result.content.replace(/```json?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { shouldRespond: true, mood: 'neutral', strategy: 'default', responseType: 'short' };
  }
}

export function detectLang(text) {
  if (!text || text.length < 3) return 'en';

  const sample = text.substring(0, 100);

  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'zh';
  if (/[\uAC00-\uD7AF]/.test(sample)) return 'ko';

  const idWords = ['aku', 'kamu', 'saya', 'gw', 'lu', 'gak', 'dong', 'sih', 'nih', 'banget', 'udah', 'gimana', 'apa', 'ini', 'itu'];
  const lower = sample.toLowerCase();
  if (idWords.filter(w => lower.includes(w)).length >= 2) return 'id';

  return 'en';
}

export default { generate, think, detectLang };
