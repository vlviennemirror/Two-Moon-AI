import config from '../config.js';
import cache from '../database/cache.js';
import userMemory from '../database/userMemory.js';
import memory from '../database/memory.js';
import personaStore from '../database/personaStore.js';
import contextBuilder from '../services/contextBuilder.js';
import groq from '../services/groqClient.js';
import sentiment from '../services/sentiment.js';
import humanizer from '../services/humanizer.js';
import personaEngine from '../services/personaEngine.js';
import styleAnalyzer from '../services/styleAnalyzer.js';
import nickname from '../utils/nickname.js';
import lurker from './lurker.js';

export async function handle(message, client) {
  if (message.author.bot) return;
  if (message.guild?.id !== config.server.allowedId) return;

  const isMentioned = message.mentions.has(client.user);
  const isReplyToBot = message.reference && await isReplyingToBot(message, client);

  if (!isMentioned && !isReplyToBot) {
    try {
      const ctx = await contextBuilder.build(message);
      const lurkCheck = await lurker.shouldLurk(message, ctx.channelHistory);
      if (lurkCheck.lurk) {
        const lurkResp = await lurker.generateLurkResponse(message, ctx, lurkCheck.topic);
        if (lurkResp) {
          await delay(humanizer.calculateDelay(lurkResp, 0));
          await message.channel.send(lurkResp);
        }
      }
    } catch (error) {
      console.error('[Lurker] Error:', error.message);
    }
    return;
  }

  const content = cleanMentions(message.content, client);
  const sentimentResult = sentiment.analyze(content);

  if (humanizer.shouldSkip(content)) {
    if (Math.random() < 0.15) {
      const quickResponses = ['yo', 'hm', '👍', 'ok'];
      await delay(500);
      await message.reply(quickResponses[Math.floor(Math.random() * quickResponses.length)]);
    }
    return;
  }

  const rateCheck = cache.checkRateLimit(message.author.id);
  if (!rateCheck.allowed) {
    await message.reply(`chill, wait ${rateCheck.resetIn}s`);
    return;
  }

  try {
    const thought = await groq.think(
      `User "${message.author.username}" said: "${content}"\nSentiment: ${sentiment.getMood(sentimentResult.score)}`,
      content
    );

    if (!thought.shouldRespond && thought.responseType === 'ignore') {
      return;
    }

    await message.channel.sendTyping();

    const context = await contextBuilder.build(message);
    const displayName = message.member?.displayName || message.author.username;
    const nick = nickname.extract(displayName);
    const lang = groq.detectLang(content);
    const memories = await memory.recallMemory(message.author.id, content, 2);

    await userMemory.upsertUser(message.author.id, displayName, lang);

    const persona = await personaStore.getEffectivePersona(message.author.id, message.guild.id);

    let userStyle = null;
    if (persona.preset === 'matchuser') {
      const userMsgs = context.channelHistory.filter(m => m.authorId === message.author.id);
      userStyle = styleAnalyzer.toPrompt(styleAnalyzer.analyze(userMsgs));
    }

    const systemPrompt = await personaEngine.buildPrompt(message.author.id, message.guild.id, userStyle);
    const userContext = contextBuilder.format(context, message, memories);
    const activeUsers = contextBuilder.getActiveUsers(context);

    let mentionMap = '';
    activeUsers.forEach((name, id) => {
      mentionMap += `${name} = <@${id}>\n`;
    });

    const finalPrompt = systemPrompt +
      `\n\n[USER LIST - use <@ID> format to mention]\n${mentionMap}` +
      `\nTalking to: ${nick}` +
      (lang === 'id' ? '\n[Language: Indonesian]' : '');

    const maxTokens = thought.responseType === 'short' ? 60 :
                      thought.responseType === 'medium' ? 120 : 80;

    const response = await groq.generate(finalPrompt, userContext, false, maxTokens);

    if (!response.success) {
      await message.reply('error');
      return;
    }

    let reply = response.content.trim();
    reply = humanizer.lowercasify(reply);
    reply = humanizer.addFiller(reply, persona.quirks);

    const typoResult = humanizer.addTypo(reply, persona.quirks);

    if (nickname.shouldMention(context) && context.targetMessage) {
      const targetId = context.targetMessage.authorId;
      if (targetId !== message.author.id && !context.targetMessage.isBot) {
        reply = `${nickname.mention(targetId)} ${reply}`;
      }
    }

    if (humanizer.shouldSplit(reply, persona.quirks)) {
      const parts = humanizer.splitResponse(reply);
      for (let i = 0; i < parts.length; i++) {
        await delay(humanizer.calculateDelay(parts[i], sentimentResult.score));
        if (i === 0) {
          await message.reply(parts[i]);
        } else {
          await message.channel.send(parts[i]);
        }
      }
    } else {
      await delay(humanizer.calculateDelay(reply, sentimentResult.score));

      if (typoResult.hasTypo) {
        await message.reply(typoResult.text);
        await delay(800 + Math.random() * 500);
        await message.channel.send(typoResult.correction);
      } else {
        await message.reply(reply);
      }
    }

    await memory.saveMemory(message.author.id, content, sentimentResult.score);
    await userMemory.updateUserSentiment(message.author.id, sentimentResult.score);

  } catch (error) {
    console.error('[Handler] Error:', error.message);
    try {
      await message.reply('something broke');
    } catch {}
  }
}

async function isReplyingToBot(message, client) {
  if (!message.reference?.messageId) return false;
  try {
    const ref = await message.channel.messages.fetch(message.reference.messageId);
    return ref.author.id === client.user.id;
  } catch {
    return false;
  }
}

function cleanMentions(content, client) {
  return content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default { handle };
