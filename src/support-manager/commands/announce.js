/**
 * Announce Command - Support Server Manager
 * Make announcements in the support server
 */

export default {
    name: 'announce',
    aliases: ['ann', 'announcement'],
    description: 'Make an announcement',
    ownerOnly: true,
    supportOnly: true,
    cooldown: 10,

    async execute(client, message, args) {
        if (!args.length) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.info)
                        .setAuthor({
                            name: 'Announcement System',
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `Create announcements.\n\n` +
                            `**Usage:**\n` +
                            `\`${client.prefix}announce <message>\` - Simple announcement\n` +
                            `\`${client.prefix}announce -title <title> | <message>\` - With title\n` +
                            `\`${client.prefix}announce -ping <message>\` - With @everyone ping`
                        )
                ]
            });
        }

        let title = null;
        let content = args.join(' ');
        let ping = false;

        // Parse flags
        if (args[0] === '-ping') {
            ping = true;
            content = args.slice(1).join(' ');
        }

        if (args[0] === '-title' || content.includes(' | ')) {
            const parts = content.replace('-title ', '').split(' | ');
            title = parts[0];
            content = parts.slice(1).join(' | ') || parts[0];
            if (parts.length === 1) {
                title = null;
            }
        }

        // Delete the command message
        await message.delete().catch(() => null);

        const embed = client.embed(client.colors.primary)
            .setAuthor({
                name: 'Announcement',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                (title ? `**${title}**\n\n` : '') +
                content +
                `\n\n— *${message.author.tag}*`
            )
            .setFooter({ 
                text: 'NeroX Support',
                iconURL: message.guild.iconURL()
            })
            .setTimestamp();

        await message.channel.send({
            content: ping ? '@everyone' : null,
            embeds: [embed],
            allowedMentions: ping ? { parse: ['everyone'] } : {},
        });
    }
};
