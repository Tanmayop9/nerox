import { Command } from '../../classes/abstract/command.js';
import { StringSelectMenuBuilder, ActionRowBuilder, ComponentType, ChannelType } from 'discord.js';

export default class DeleteTicketPanel extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ['ticketdelete', 'tdelete'];
    this.description = 'Delete a ticket panel (Admin only)';
  }

  execute = async (client, ctx) => {
    if (!ctx.member.permissions.has('Administrator')) {
      return ctx.reply({
        embeds: [client.embed().desc(`${client.emoji.cross} You need \`Administrator\` permission to use this command.`)],
      });
    }

    const data = await client.db.ticket.get(ctx.guild.id);

    if (!data || data.length === 0) {
      return ctx.reply({
        embeds: [client.embed().desc(`${client.emoji.cross} No ticket panels found to delete.`)],
      });
    }

    const options = data.map((panel, i) => ({
      label: panel.label || `Panel ${i + 1}`,
      description: `Channel: #${ctx.guild.channels.cache.get(panel.channelId)?.name || 'Unknown'}`,
      value: panel.messageId,
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('delete_ticket_panel')
      .setPlaceholder('Select a ticket panel to delete')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const msg = await ctx.reply({
      embeds: [client.embed().desc(`Select a ticket panel to delete:`)],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30000,
      max: 1,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== ctx.author.id) {
        return i.reply({ content: 'Only the command executor can interact with this menu.', ephemeral: true });
      }

      const selectedId = i.values[0];
      const updated = data.filter(p => p.messageId !== selectedId);

      const panelToDelete = data.find(p => p.messageId === selectedId);
      const channel = ctx.guild.channels.cache.get(panelToDelete.channelId);
      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(panelToDelete.messageId).catch(() => null);
        if (message) await message.delete().catch(() => null);
      }

      await client.db.ticket.set(ctx.guild.id, updated);

      await i.update({
        embeds: [client.embed().desc(`${client.emoji.tick} Ticket panel deleted successfully.`)],
        components: [],
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await msg.edit({
          content: 'Ticket panel deletion timed out.',
          components: [],
        }).catch(() => {});
      }
    });
  };
}