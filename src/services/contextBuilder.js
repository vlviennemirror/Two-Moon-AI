import config from '../config.js';
import cache from '../database/cache.js';
import db from '../database/connection.js';

export async function buildContext(message) {
  const context = {
    replyChain: [],
    channelHistory: [],
    targetMessage: null
  };
  
  if (message.reference?.messageId) {
    context.replyChain = await traceReplyChain(message, config.context.replyChainDepth);
    if (context.replyChain.length > 0) {
      context.targetMessage = context.replyChain[0];
    }
  }
  
  context.channelHistory = await getChannelHistory(message.channel, message.id);
  
  return context;
}

async function traceReplyChain(message, maxDepth) {
  const chain = [];
  let current = message;
  let depth = 0;
  
  while (current.reference?.messageId && depth < maxDepth) {
    try {
      const parent = await current.channel.messages.fetch(current.reference.messageId);
      chain.push({
        id: parent.id,
        author: parent.author.username,
        authorId: parent.author.id,
        content: parent.content,
        isBot: parent.author.bot,
        timestamp: parent.createdTimestamp
      });
      current = parent;
      depth++;
    } catch {
      break;
    }
  }
  
  return chain;
}

async function getChannelHistory(channel, excludeMessageId) {
  const cacheKey = channel.id;
  const cached = cache.getContextCache(cacheKey);
  
  if (cached && cached.length > 0) {
    const freshEnough = Date.now() - cached[0].timestamp < 60000;
    if (freshEnough) return cached.filter(m => m.id !== excludeMessageId);
  }
  
  try {
    const messages = await channel.messages.fetch({ limit: config.context.historyLimit });
    const history = Array.from(messages.values())
      .filter(m => m.id !== excludeMessageId)
      .map(m => ({
        id: m.id,
        author: m.author.username,
        authorId: m.author.id,
        content: m.content,
        isBot: m.author.bot,
        timestamp: m.createdTimestamp
      }))
      .reverse();
    
    cache.setContextCache(cacheKey, history);
    await saveHistoryToDb(channel.id, history);
    
    return history;
  } catch {
    return [];
  }
}

async function saveHistoryToDb(channelId, messages) {
  const recentMessages = messages.slice(-10);
  
  for (const msg of recentMessages) {
    try {
      await db.query(
        `INSERT INTO conversation_cache (channel_id, message_id, user_id, content, is_bot, created_at)
         VALUES ($1, $2, $3, $4, $5, to_timestamp($6/1000.0))
         ON CONFLICT (message_id) DO NOTHING`,
        [channelId, msg.id, msg.authorId, msg.content, msg.isBot, msg.timestamp]
      );
    } catch { }
  }
}

export function formatContextForPrompt(context, currentMessage) {
  let formatted = '';
  
  if (context.replyChain.length > 0) {
    formatted += '[REPLY CONTEXT]\n';
    const reversed = [...context.replyChain].reverse();
    for (const msg of reversed) {
      const role = msg.isBot ? 'Assistant' : msg.author;
      formatted += `${role}: ${truncate(msg.content, 300)}\n`;
    }
    formatted += '\n';
  }
  
  if (context.channelHistory.length > 0) {
    formatted += '[RECENT CHAT]\n';
    const recent = context.channelHistory.slice(-10);
    for (const msg of recent) {
      const role = msg.isBot ? 'Assistant' : msg.author;
      formatted += `${role}: ${truncate(msg.content, 200)}\n`;
    }
    formatted += '\n';
  }
  
  formatted += `[CURRENT MESSAGE]\n${currentMessage.author.username}: ${currentMessage.content}`;
  
  return formatted;
}

function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

export default { buildContext, formatContextForPrompt };
