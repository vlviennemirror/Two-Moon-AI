import config from '../config.js';
import cache from '../database/cache.js';

export async function build(message) {
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

  context.channelHistory = await getHistory(message.channel, message.id);
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
    } catch (error) {
      break;
    }
  }

  return chain;
}

async function getHistory(channel, excludeId) {
  const cached = cache.getContext(channel.id);
  if (cached?.length > 0 && Date.now() - cached[0].timestamp < 60000) {
    return cached.filter(m => m.id !== excludeId);
  }

  try {
    const messages = await channel.messages.fetch({ limit: config.context.historyLimit });
    const history = Array.from(messages.values())
      .filter(m => m.id !== excludeId)
      .map(m => ({
        id: m.id,
        author: m.author.username,
        authorId: m.author.id,
        content: m.content,
        isBot: m.author.bot,
        timestamp: m.createdTimestamp
      }))
      .reverse();

    cache.setContext(channel.id, history);
    return history;
  } catch (error) {
    console.error('[Context] History fetch error:', error.message);
    return [];
  }
}

export function format(context, message, memories = []) {
  let out = '';

  if (memories.length > 0) {
    out += '[MEMORIES]\n';
    memories.forEach(m => {
      out += `- ${m.substring(0, 100)}\n`;
    });
    out += '\n';
  }

  if (context.replyChain.length > 0) {
    out += '[REPLY CONTEXT]\n';
    const reversed = [...context.replyChain].reverse();
    reversed.forEach(m => {
      const role = m.isBot ? 'Bot' : m.author;
      out += `${role}: ${m.content.substring(0, 200)}\n`;
    });
    out += '\n';
  }

  if (context.channelHistory.length > 0) {
    out += '[RECENT CHAT]\n';
    const recent = context.channelHistory.slice(-8);
    recent.forEach(m => {
      const role = m.isBot ? 'Bot' : m.author;
      out += `${role}: ${m.content.substring(0, 150)}\n`;
    });
    out += '\n';
  }

  out += `[CURRENT]\n${message.author.username}: ${message.content}`;
  return out;
}

export function getActiveUsers(context) {
  const users = new Map();
  if (context.channelHistory) {
    context.channelHistory.forEach(m => {
      if (!m.isBot) {
        users.set(m.authorId, m.author);
      }
    });
  }
  return users;
}

export default { build, format, getActiveUsers };
