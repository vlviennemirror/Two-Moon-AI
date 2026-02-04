import cache from '../database/cache.js';
import userMemory from '../database/userMemory.js';
import contextBuilder from '../services/contextBuilder.js';
import groqClient from '../services/groqClient.js';
import promptBuilder from '../services/promptBuilder.js';
import personaEngine from '../services/personaEngine.js';
import nicknameHelper from '../utils/nicknameHelper.js';

export async function handleMessage(message, client) {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  const isMentioned = message.mentions.has(client.user);
  const isReplyToBot = message.reference && await isReplyingToBot(message, client);
  
  if (!isMentioned && !isReplyToBot) return;
  
  const rateCheck = cache.checkRateLimit(message.author.id);
  if (!rateCheck.allowed) {
    await message.reply(`chill, wait ${rateCheck.resetIn}s`);
    return;
  }
  
  const userContent = cleanMentions(message.content, client);
  
  if (promptBuilder.detectTroll(userContent)) {
    const trollResp = promptBuilder.getTrollResponse();
    await message.reply(trollResp);
    return;
  }
  
  await message.channel.sendTyping();
  
  try {
    const context = await contextBuilder.buildContext(message);
    const displayName = message.member?.displayName || message.author.username;
    const nickname = nicknameHelper.extractNickname(displayName);
    
    const detectedLang = await groqClient.detectLanguage(userContent);
    await userMemory.upsertUser(message.author.id, displayName, detectedLang);
    
    const contextIntensity = personaEngine.detectContextIntensity(message, context);
    
    const systemPrompt = await personaEngine.buildPersonalizedPrompt(
      message.author.id,
      message.guild.id,
      context.channelHistory,
      message
    );
    
    const nicknamePrompt = nickname ? `\nTalking to: "${nickname}". Use naturally, don't overdo.` : '';
    const langPrompt = detectedLang !== 'en' ? `\nMatch their language (${detectedLang}).` : '';
    
    const task = promptBuilder.detectTask(userContent);
    const taskPrompt = task !== 'default' ? `\nCURRENT TASK: ${getTaskInstruction(task)}` : '';
    
    const finalPrompt = systemPrompt + nicknamePrompt + langPrompt + taskPrompt;
    
    const formattedContext = contextBuilder.formatContextForPrompt(context, {
      author: message.author,
      content: userContent
    });
    
    const maxTokens = contextIntensity === 'light' ? 400 : contextIntensity === 'heavy' ? 200 : 256;
    
    const response = await groqClient.generateResponse(finalPrompt, formattedContext, maxTokens);
    
    if (!response.success) {
      await message.reply('something broke, try again');
      return;
    }
    
    let reply = response.content;
    
    if (nicknameHelper.shouldMentionUser(context) && context.targetMessage) {
      const targetId = context.targetMessage.authorId;
      if (targetId !== message.author.id && !context.targetMessage.isBot) {
        reply = `${nicknameHelper.formatMention(targetId)} ${reply}`;
      }
    }
    
    const chunks = splitMessage(reply);
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
    
  } catch (error) {
    await message.reply('my bad, something broke');
  }
}

function getTaskInstruction(task) {
  const tasks = {
    translate: 'Translate the target message. Just give translation.',
    explain: 'Explain briefly and simply.',
    summarize: 'Summarize in 1-2 sentences.'
  };
  return tasks[task] || '';
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
  return content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
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
    if (splitIndex === -1) splitIndex = maxLen;
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trim();
  }
  return chunks;
}

export default { handleMessage };