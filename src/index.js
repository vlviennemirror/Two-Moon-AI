import { Client, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import config from './config.js';
import db from './database/connection.js';
import messageHandler from './handlers/messageHandler.js';
import slashCommands from './handlers/slashCommands.js';

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
  console.log(`[Bot] Logged in as ${client.user.tag}`);
  console.log(`[Bot] Allowed server: ${config.server.allowedId}`);

  await db.initDatabase();

  try {
    const rest = new REST().setToken(config.discord.token);
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.server.allowedId),
      { body: slashCommands.getJSON() }
    );
    console.log('[Bot] Slash commands registered');
  } catch (error) {
    console.error('[Bot] Failed to register slash commands:', error.message);
  }

  setInterval(async () => {
    try {
      await db.cleanup(7);
    } catch (error) {
      console.error('[Bot] Cleanup error:', error.message);
    }
  }, 6 * 60 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
  try {
    await messageHandler.handle(message, client);
  } catch (error) {
    console.error('[Bot] Message handler error:', error.message);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.guildId !== config.server.allowedId) {
    await interaction.reply({ content: 'Server not allowed', ephemeral: true });
    return;
  }

  try {
    await slashCommands.handle(interaction);
  } catch (error) {
    console.error('[Bot] Interaction error:', error.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Error', ephemeral: true });
    }
  }
});

client.on('error', (error) => {
  console.error('[Bot] Client error:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('[Bot] Unhandled rejection:', error);
});

client.login(config.discord.token);
