import Groq from 'groq-sdk';
import config from '../config.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

export async function generateResponse(systemPrompt, userContext, maxTokens = null) {
  try {
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ],
      max_tokens: maxTokens || config.groq.maxTokens,
      temperature: 0.85,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    });
    
    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage
    };
  } catch (error) {
    return { success: false, error: error.message, content: null };
  }
}

export async function detectLanguage(text) {
  if (!text || text.length < 3) return 'en';
  
  const sample = text.substring(0, 100);
  
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'zh';
  if (/[\uAC00-\uD7AF]/.test(sample)) return 'ko';
  if (/[\u0E00-\u0E7F]/.test(sample)) return 'th';
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar';
  if (/[\u0400-\u04FF]/.test(sample)) return 'ru';
  
  const idWords = ['aku', 'kamu', 'saya', 'ini', 'itu', 'yang', 'dan', 'dengan', 'untuk', 'tidak', 'bisa', 'ada', 'mau', 'tolong', 'gimana', 'kenapa', 'bagaimana', 'apa', 'gak', 'gw', 'lu', 'dong', 'deh', 'sih', 'nih', 'tuh', 'banget', 'udah', 'belum', 'kalo', 'kayak'];
  const lower = sample.toLowerCase();
  const idCount = idWords.filter(w => new RegExp(`\\b${w}\\b`).test(lower)).length;
  if (idCount >= 2) return 'id';
  
  return 'en';
}

export default { generateResponse, detectLanguage };
