import cache from '../database/cache.js';
import userMemory from '../database/userMemory.js';
import contextBuilder from '../services/contextBuilder.js';
import groqClient from '../services/groqClient.js';
import promptBuilder from '../services/promptBuilder.js';

export async function handleMessage(message, client) {
  if (message.author.bot) return;
  
  const isMentioned = message.mentions.has(client.user);
  const isReplyToBot = message.reference && 
    (await isReplyingToBot(message, client));
  
  if (!isMentioned && !isReplyToBot) return;
  
  const rateCheck = cache.checkRateLimit(message.author.id);
  if (!rateCheck.allowed) {
    await message.reply(`⏳ Rate limited. Try again in ${rateCheck.resetIn}s`);
    return;
  }
  
  await message.channel.sendTyping();
  
  try {
    const context = await contextBuilder.buildContext(message);
    
    const userContent = cleanMentions(message.content, client);
    const detectedLang = await groqClient.detectLanguage(userContent);
    
    await userMemory.upsertUser(
      message.author.id, 
      message.author.username,
      detectedLang
    );
    
    const task = promptBuilder.detectTask(userContent);
    const systemPrompt = promptBuilder.buildSystemPrompt(detectedLang, task);
    const formattedContext = contextBuilder.formatContextForPrompt(context, {
      author: message.author,
      content: userContent
    });
    
    const response = await groqClient.generateResponse(systemPrompt, formattedContext);
    
    if (!response.success) {
      await message.reply('❌ Error generating response. Please try again.');
      return;
    }
    
    const chunks = splitMessage(response.content);
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
    
  } catch (error) {
    await message.reply('❌ Something went wrong.');
  }
}

async function isReplyingToBot(message, client) {
  if (!message.reference?.messageId) return false;
  
  try {
    const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
    return repliedTo.author.id === client.user.id;
  } catch {
    return false;
  }
}

function cleanMentions(content, client) {
  return content
    .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
    .trim();
}

function splitMessage(text, maxLen = 1900) {
  if (text.length <= maxLen) return [text];
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    
    let splitIndex = remaining.lastIndexOf('\n', maxLen);
    if (splitIndex === -1 || splitIndex < maxLen / 2) {
      splitIndex = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitIndex === -1 || splitIndex < maxLen / 2) {
      splitIndex = maxLen;
    }
    
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trim();
  }
  
  return chunks;
}

export default { handleMessage };
