import { Command } from '../../classes/abstract/command.js';

export default class TicketSetup extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ['ticketsetup', 'ticket-create'];
    this.description = 'Interactive & customizable ticket panel setup (Limit: 5)';
  }

  execute = async (client, ctx) => {
    const questions = [
      { key: 'message', prompt: '**Enter the message before the embed (or type `none`)**' },
      { key: 'title', prompt: '**Enter the embed title**' },
      { key: 'description', prompt: '**Enter the embed description**' },
      { key: 'footer', prompt: '**Enter the footer (or type `none`)**' },
      { key: 'label', prompt: '**Enter the button label (default: `Open Ticket`)**' },
      { key: 'category', prompt: '**Mention the category where tickets will be created**' },
      { key: 'pingRole', prompt: '**Mention the role to ping on ticket open (or type `none`)**' },
      { key: 'channel', prompt: '**Mention the channel where the ticket panel should be sent**' },
    ];

    const filter = m => m.author.id === ctx.author.id;
    const answers = {};

    for (const { key, prompt } of questions) {
      await ctx.channel.send(prompt);
      const collected = await ctx.channel.awaitMessages({ filter, max: 1, time: 60000 }).catch(() => null);
      const msg = collected?.first();
      if (!msg) return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.cross} **Setup cancelled: No response.**`)] });
      const input = msg.content.trim();
      if (input.toLowerCase() === 'cancel') return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.cross} **Ticket setup cancelled.**`)] });
      answers[key] = input.toLowerCase() === 'none' ? null : input;
    }

    const extractId = str => str?.match(/\d{17,}/)?.[0];

    const category = ctx.guild.channels.cache.get(extractId(answers.category));
    if (!category || category.type !== 4)
      return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.cross} **Invalid category provided.**`)] });

    const panelChannel = ctx.guild.channels.cache.get(extractId(answers.channel));
    if (!panelChannel || !panelChannel.send)
      return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.cross} **Invalid panel channel provided.**`)] });

    const existingPanels = await client.db.ticket.get(ctx.guild.id) || [];
    if (existingPanels.length >= 5)
      return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.cross} **Limit reached: You already have 5 panels.**, use \`&deleteticket\` to delete tickets`)] });

    const panelEmbed = client.embed()
      .title(answers.title || 'Support Panel')
      .desc(answers.description || 'Click the button below to open a ticket.')
      .footer(answers.footer ? { text: answers.footer } : null);

    const ticketButton = client.button().primary('create_ticket', answers.label || 'Open Ticket');

    const sent = await panelChannel.send({
      content: answers.message || null,
      embeds: [panelEmbed],
      components: [{ type: 1, components: [ticketButton] }]
    });

    existingPanels.push({
      messageId: sent.id,
      channelId: panelChannel.id,
      categoryId: category.id,
      pingRole: extractId(answers.pingRole),
      label: answers.label || 'Open Ticket'
    });

    await client.db.ticket.set(ctx.guild.id, existingPanels);

    return ctx.reply({ embeds: [client.embed().desc(`${client.emoji.check} **Ticket panel created and sent successfully!**`)] });
  };
}