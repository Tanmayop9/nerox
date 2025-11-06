export default class {
  constructor() {
    this.name = "buttonClick";
  }

  execute = async (client, interaction) => {
    if (interaction.customId !== "create_ticket") return;

    const panels = (await client.db.ticket.get(interaction.guild.id)) || [];
    const panel = panels.find(p => p.messageId === interaction.message.id);
    if (!panel)
      return interaction.reply({ content: "This panel is no longer active.", ephemeral: true });

    const existing = interaction.guild.channels.cache.find(
      ch => ch.topic === `ticket-${interaction.user.id}`
    );
    if (existing)
      return interaction.reply({
        content: `You already have an open ticket: ${existing}`,
        ephemeral: true
      });

    const cat = interaction.guild.channels.cache.get(panel.categoryId);
    if (!cat)
      return interaction.reply({ content: "Ticket category no longer exists.", ephemeral: true });

    const ch = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: 0,
      parent: cat.id,
      topic: `ticket-${interaction.user.id}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: ["ViewChannel"]
        },
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages", "AttachFiles", "EmbedLinks"]
        },
        {
          id: client.user.id,
          allow: ["ViewChannel", "ManageChannels"]
        },
        ...(panel.pingRole ? [{
          id: panel.pingRole,
          allow: ["ViewChannel", "SendMessages"]
        }] : [])
      ]
    });

    await interaction.reply({
      content: `Ticket created: ${ch}`,
      ephemeral: true
    });

    const embed = new client.embed("#2f3136")
      .title("Welcome to your Ticket")
      .desc("Please describe your issue in detail. Our team will assist you shortly.")
      .footer({ text: interaction.guild.name });

    await ch.send({
      content: panel.pingRole ? `<@&${panel.pingRole}>` : null,
      embeds: [embed]
    });
  };
}