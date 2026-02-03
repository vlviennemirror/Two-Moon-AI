import Groq from 'groq-sdk';
import config from '../config.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

export async function generateResponse(systemPrompt, userContext) {
  try {
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ],
      max_tokens: config.groq.maxTokens,
      temperature: config.groq.temperature
    });
    
    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      content: null
    };
  }
}

export async function detectLanguage(text) {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { 
          role: 'system', 
          content: 'Detect the language of the text. Reply with only the ISO 639-1 code (e.g., en, id, ja, zh). If unsure, reply "en".'
        },
        { role: 'user', content: text.substring(0, 200) }
      ],
      max_tokens: 5,
      temperature: 0
    });
    
    const lang = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
    return lang.substring(0, 2);
  } catch {
    return 'en';
  }
}

export default { generateResponse, detectLanguage };
