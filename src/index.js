import { Client, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.js';
import db from './database/connection.js';
import messageHandler from './handlers/messageHandler.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel]
});

client.once('ready', async () => {
  await db.initDatabase();
  scheduleCleanup();
});

client.on('messageCreate', async (message) => {
  await messageHandler.handleMessage(message, client);
});

function scheduleCleanup() {
  setInterval(async () => {
    try {
      await db.cleanupOldData(7);
    } catch { }
  }, 6 * 60 * 60 * 1000);
}

client.login(config.discord.token);
