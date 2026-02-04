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
  await db.initDatabase();
  await registerCommands();
  scheduleCleanup();
});

client.on('messageCreate', async (message) => {
  await messageHandler.handleMessage(message, client);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    await slashCommands.handleSlashCommand(interaction);
  } catch (error) {
    const content = { content: 'Something went wrong', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(content);
    } else {
      await interaction.reply(content);
    }
  }
});

async function registerCommands() {
  const rest = new REST().setToken(config.discord.token);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashCommands.getCommandsJSON() }
    );
  } catch (error) {}
}

function scheduleCleanup() {
  setInterval(async () => {
    try {
      await db.cleanupOldData(7);
    } catch {}
  }, 6 * 60 * 60 * 1000);
}

client.login(config.discord.token);