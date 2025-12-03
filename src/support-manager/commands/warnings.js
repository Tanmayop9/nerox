/**
 * Warnings Command - Support Server Manager
 * View warnings for a user
 */

export default {
    name: 'warnings',
    aliases: ['warns', 'infractions'],
    description: 'View warnings for a user',
    supportOnly: true,
    cooldown: 3,

    async execute(client, message, args) {
        const target = message.mentions.users.first() || 
            await client.users.fetch(args[0]).catch(() => null) ||
            message.author;

        const warnings = await client.db.warnings.get(target.id) || [];

        if (warnings.length === 0) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.success)
                        .setDescription(
                            `${client.emoji.check} **${target.tag}** has no warnings! 🌟\n\n` +
                            `They've been a good member~ 💕`
                        )
                ]
            });
        }

        const embed = client.embed(client.colors.warning)
            .setAuthor({
                name: `⚠️ Warnings for ${target.tag}`,
                iconURL: target.displayAvatarURL()
            })
            .setThumbnail(target.displayAvatarURL())
            .setDescription(
                `Here are all the warnings for this user! 📋\n\n` +
                warnings.map((warn, i) => {
                    const mod = client.users.cache.get(warn.moderator)?.tag || warn.moderator;
                    return `**${i + 1}. ${warn.id}**\n` +
                        `Reason: ${warn.reason}\n` +
                        `By: ${mod} • <t:${Math.floor(warn.timestamp / 1000)}:R>`;
                }).join('\n\n') +
                `\n\n*Total: ${warnings.length} warning(s)* ${warnings.length >= 3 ? '⚠️' : '📝'}`
            )
            .setFooter({ text: '💖 NeroX Support Manager' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
