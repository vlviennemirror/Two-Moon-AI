import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import personaStore from '../database/personaStore.js';
import personaEngine from '../services/personaEngine.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('persona')
    .setDescription('Customize how Two Moon talks to you')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set your personality preset')
        .addStringOption(opt =>
          opt.setName('preset')
            .setDescription('Choose a personality')
            .setRequired(true)
            .addChoices(
              { name: 'Two Moon - Calm & balanced', value: 'twomoon' },
              { name: 'Homie - Chill & playful', value: 'homie' },
              { name: 'Mentor - Wise & thoughtful', value: 'mentor' },
              { name: 'Chaos - Savage & unhinged', value: 'chaos' },
              { name: 'Professional - Formal & detailed', value: 'professional' },
              { name: 'Match Me - Mirrors your style', value: 'matchuser' }
            )))
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View your current persona settings'))
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset to server default')),

  new SlashCommandBuilder()
    .setName('server-persona')
    .setDescription('Set server-wide default personality (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set server default preset')
        .addStringOption(opt =>
          opt.setName('preset')
            .setDescription('Choose server default')
            .setRequired(true)
            .addChoices(
              { name: '🌙 Two Moon', value: 'twomoon' },
              { name: '😎 Homie', value: 'homie' },
              { name: '🧙 Mentor', value: 'mentor' },
              { name: '🔥 Chaos', value: 'chaos' },
              { name: '💼 Professional', value: 'professional' }
            ))
        .addStringOption(opt =>
          opt.setName('quirks')
            .setDescription('How human-like should responses be?')
            .addChoices(
              { name: 'Light - Minimal quirks', value: 'light' },
              { name: 'Medium - Balanced', value: 'medium' },
              { name: 'Heavy - Very human-like', value: 'heavy' }
            )))
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View server persona settings'))
];

export async function handleSlashCommand(interaction) {
  const { commandName } = interaction;
  
  if (commandName === 'persona') {
    await handlePersonaCommand(interaction);
  } else if (commandName === 'server-persona') {
    await handleServerPersonaCommand(interaction);
  }
}

async function handlePersonaCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const serverId = interaction.guildId;
  
  if (subcommand === 'set') {
    const preset = interaction.options.getString('preset');
    await personaStore.setUserPersona(userId, { preset });
    
    const emoji = personaEngine.getPresetEmoji(preset);
    const desc = personaEngine.getPresetDescription(preset);
    
    await interaction.reply({
      content: `${emoji} **Persona set to ${preset}**\n${desc}`,
      ephemeral: true
    });
  }
  
  else if (subcommand === 'view') {
    const effective = await personaStore.getEffectivePersona(userId, serverId);
    const emoji = personaEngine.getPresetEmoji(effective.preset);
    
    let response = `${emoji} **Your Persona: ${effective.preset}**\n`;
    response += `Source: ${effective.source === 'user' ? 'Personal setting' : 'Server default'}\n`;
    response += `Quirk intensity: ${effective.quirkIntensity}\n\n`;
    response += `*${personaEngine.getPresetDescription(effective.preset)}*`;
    
    await interaction.reply({ content: response, ephemeral: true });
  }
  
  else if (subcommand === 'reset') {
    await personaStore.resetUserPersona(userId);
    await interaction.reply({
      content: `✓ Reset to server default`,
      ephemeral: true
    });
  }
}

async function handleServerPersonaCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const serverId = interaction.guildId;
  
  if (subcommand === 'set') {
    const preset = interaction.options.getString('preset');
    const quirks = interaction.options.getString('quirks') || 'medium';
    
    await personaStore.setServerPersona(serverId, {
      preset,
      quirkIntensity: quirks
    });
    
    const emoji = personaEngine.getPresetEmoji(preset);
    
    await interaction.reply({
      content: `${emoji} **Server default set to ${preset}**\nQuirk intensity: ${quirks}`,
      ephemeral: false
    });
  }
  
  else if (subcommand === 'view') {
    const serverPersona = await personaStore.getServerPersona(serverId);
    const emoji = personaEngine.getPresetEmoji(serverPersona.preset);
    
    let response = `${emoji} **Server Default: ${serverPersona.preset || 'twomoon'}**\n`;
    response += `Quirk intensity: ${serverPersona.quirk_intensity || 'medium'}\n\n`;
    response += `*Users can override with /persona set*`;
    
    await interaction.reply({ content: response, ephemeral: true });
  }
}

export function getCommandsJSON() {
  return commands.map(cmd => cmd.toJSON());
}

export default { commands, handleSlashCommand, getCommandsJSON };