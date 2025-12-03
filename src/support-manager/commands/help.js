/**
 * Help Command - Support Server Manager
 */

export default {
    name: 'shelp',
    aliases: ['sh', 'supporthelp'],
    description: 'Shows support manager commands',
    cooldown: 3,

    async execute(client, message, args) {
        const isOwner = client.owners.includes(message.author.id);

        const embed = client.embed(client.colors.primary)
            .setAuthor({
                name: `${client.user.username} Help`,
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
                `NeroX Support Manager\n\n` +
                `**Giveaway Commands**\n` +
                `\`${client.prefix}giveaway\` - Giveaway system\n` +
                `\`${client.prefix}giveaway create <duration> <prize> <winners>\`\n` +
                `\`${client.prefix}giveaway end/reroll/list/delete\`\n\n` +
                `**User Management**\n` +
                `\`${client.prefix}noprefix <add/remove/list> [user]\`\n` +
                `\`${client.prefix}premium <add/remove/list> [user] [days]\`\n` +
                `\`${client.prefix}redeem <code>\` - Redeem a code\n\n` +
                `**Moderation**\n` +
                `\`${client.prefix}warn <user> [reason]\`\n` +
                `\`${client.prefix}warnings <user>\`\n` +
                `\`${client.prefix}clearwarns <user>\`\n\n` +
                `**Server Info**\n` +
                `\`${client.prefix}sstats\` - Support manager stats\n` +
                `\`${client.prefix}serverinfo\` - Server information\n` +
                (isOwner ? 
                    `\n**Owner Commands**\n` +
                    `\`${client.prefix}announce <message>\` - Make an announcement\n` +
                    `\`${client.prefix}seval <code>\` - Evaluate code\n` : '')
            )
            .setFooter({ 
                text: `Prefix: ${client.prefix} | Commands: ${client.commands.size}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
