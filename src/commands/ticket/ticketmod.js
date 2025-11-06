/** @format * Ticket Mod Panel - Neptune */

import { Command } from '../../classes/abstract/command.js';
import {
  ActionRowBuilder,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
} from 'discord.js';

export default class TicketMod extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ['tmod'];
    this.description = 'Ticket mod panel for advanced control';
  }

  execute = async (client, ctx) => {
    const ticketData = (await client.db.ticket.get(ctx.guild.id)) || [];
    const current = ticketData.find(t => t.categoryId === ctx.channel.parentId);

    if (!current)
      return ctx.reply({
        embeds: [client.embed().desc(`${client.emoji.cross} This command can only be used in a **ticket channel**.`)],
      });

    if (!ctx.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return ctx.reply({
        embeds: [client.embed().desc(`${client.emoji.cross} You need \`Manage Channels\` permission to use this.`)],
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('rename_ticket').setLabel('Rename Ticket').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('add_user').setLabel('Add User').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('remove_user').setLabel('Remove User').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('close_panel').setLabel('Close Panel').setStyle(ButtonStyle.Danger)
    );

    const panelMsg = await ctx.channel.send({
      embeds: [client.embed().desc('**Ticket Mod Panel - Active for 10 minutes**')],
      components: [row],
    });

    const collector = panelMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600_000, // 10 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== ctx.author.id) return i.reply({ content: 'Only the executor can use these buttons.', ephemeral: true });

      if (!ctx.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return i.reply({ content: 'You lack permissions.', ephemeral: true });
      }

      switch (i.customId) {
        case 'close_ticket':
          await ctx.channel.delete().catch(() => {});
          break;

        case 'rename_ticket':
          await i.reply({ content: 'Send the new name for this ticket channel:', ephemeral: true });
          const nameMsg = await ctx.channel.awaitMessages({
            filter: m => m.author.id === ctx.author.id,
            max: 1,
            time: 30000,
          }).catch(() => null);
          const newName = nameMsg?.first()?.content;
          if (!newName) return;
          await ctx.channel.setName(newName.slice(0, 100)).catch(() => {});
          await i.followUp({ content: `Renamed to **${newName}**`, ephemeral: true });
          break;

        case 'add_user':
          await i.reply({ content: 'Mention the user to add:', ephemeral: true });
          const addMsg = await ctx.channel.awaitMessages({
            filter: m => m.author.id === ctx.author.id,
            max: 1,
            time: 30000,
          }).catch(() => null);
          const userToAdd = addMsg?.first()?.mentions?.users?.first();
          if (!userToAdd) return;
          await ctx.channel.permissionOverwrites.create(userToAdd, { ViewChannel: true, SendMessages: true });
          await i.followUp({ content: `${userToAdd} added to ticket!`, ephemeral: true });
          break;

        case 'remove_user':
          await i.reply({ content: 'Mention the user to remove:', ephemeral: true });
          const remMsg = await ctx.channel.awaitMessages({
            filter: m => m.author.id === ctx.author.id,
            max: 1,
            time: 30000,
          }).catch(() => null);
          const userToRemove = remMsg?.first()?.mentions?.users?.first();
          if (!userToRemove) return;
          await ctx.channel.permissionOverwrites.delete(userToRemove.id).catch(() => {});
          await i.followUp({ content: `${userToRemove} removed from ticket!`, ephemeral: true });
          break;

        case 'close_panel':
          collector.stop('closed');
          await i.update({ content: 'Mod panel closed.', components: [] });
          break;
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'closed') {
        await panelMsg.edit({
          content: 'Mod panel expired.',
          components: [],
        }).catch(() => {});
      }
    });
  };
}