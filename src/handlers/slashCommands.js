import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import personaStore from '../database/personaStore.js';
import personaEngine from '../services/personaEngine.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('persona')
    .setDescription('Set how Two Moon talks to you')
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Choose a personality preset')
      .addStringOption(opt => opt
        .setName('preset')
        .setDescription('Preset personality')
        .setRequired(true)
        .addChoices(
          { name: '🌙 Two Moon - Calm & balanced', value: 'twomoon' },
          { name: '😎 Homie - Chill & friendly', value: 'homie' },
          { name: '🧙 Mentor - Wise & thoughtful', value: 'mentor' },
          { name: '🔥 Chaos - Savage & unhinged', value: 'chaos' },
          { name: '💼 Professional - Formal', value: 'professional' },
          { name: '🪞 Match Me - Mirrors your style', value: 'matchuser' }
        )))
    .addSubcommand(sub => sub
      .setName('view')
      .setDescription('View your current settings'))
    .addSubcommand(sub => sub
      .setName('reset')
      .setDescription('Reset to server default')),

  new SlashCommandBuilder()
    .setName('server-persona')
    .setDescription('Set server-wide default (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set server default preset')
      .addStringOption(opt => opt
        .setName('preset')
        .setDescription('Preset')
        .setRequired(true)
        .addChoices(
          { name: '🌙 Two Moon', value: 'twomoon' },
          { name: '😎 Homie', value: 'homie' },
          { name: '🧙 Mentor', value: 'mentor' },
          { name: '🔥 Chaos', value: 'chaos' },
          { name: '💼 Professional', value: 'professional' }
        ))
      .addStringOption(opt => opt
        .setName('quirks')
        .setDescription('How human-like')
        .addChoices(
          { name: 'Light - Minimal quirks', value: 'light' },
          { name: 'Medium - Balanced', value: 'medium' },
          { name: 'Heavy - Very human-like', value: 'heavy' }
        )))
    .addSubcommand(sub => sub
      .setName('view')
      .setDescription('View server settings'))
];

export async function handle(interaction) {
  const { commandName } = interaction;

  try {
    if (commandName === 'persona') {
      await handlePersona(interaction);
    } else if (commandName === 'server-persona') {
      await handleServerPersona(interaction);
    }
  } catch (error) {
    console.error('[Slash] Error:', error.message);
    const content = { content: 'Something went wrong', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(content);
    } else {
      await interaction.reply(content);
    }
  }
}

async function handlePersona(interaction) {
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const serverId = interaction.guildId;

  if (sub === 'set') {
    const preset = interaction.options.getString('preset');
    await personaStore.setUserPersona(userId, preset, null, null);

    const emoji = personaEngine.getEmoji(preset);
    const desc = personaEngine.getDesc(preset);

    await interaction.reply({
      content: `${emoji} **Persona set to ${preset}**\n${desc}`,
      ephemeral: true
    });
  } else if (sub === 'view') {
    const effective = await personaStore.getEffectivePersona(userId, serverId);
    const emoji = personaEngine.getEmoji(effective.preset);

    await interaction.reply({
      content: `${emoji} **Your Persona: ${effective.preset}**\nSource: ${effective.source}`,
      ephemeral: true
    });
  } else if (sub === 'reset') {
    await personaStore.resetUserPersona(userId);
    await interaction.reply({
      content: '✓ Reset to server default',
      ephemeral: true
    });
  }
}

async function handleServerPersona(interaction) {
  const sub = interaction.options.getSubcommand();
  const serverId = interaction.guildId;

  if (sub === 'set') {
    const preset = interaction.options.getString('preset');
    const quirks = interaction.options.getString('quirks') || 'heavy';

    await personaStore.setServerPersona(serverId, preset, quirks);

    const emoji = personaEngine.getEmoji(preset);

    await interaction.reply({
      content: `${emoji} **Server default set to ${preset}**\nQuirk intensity: ${quirks}`
    });
  } else if (sub === 'view') {
    const serverPersona = await personaStore.getServerPersona(serverId);
    const emoji = personaEngine.getEmoji(serverPersona.preset);

    await interaction.reply({
      content: `${emoji} **Server Default: ${serverPersona.preset || 'twomoon'}**\nQuirks: ${serverPersona.quirk_intensity || 'heavy'}`,
      ephemeral: true
    });
  }
}

export function getJSON() {
  return commands.map(cmd => cmd.toJSON());
}

export default { commands, handle, getJSON };
