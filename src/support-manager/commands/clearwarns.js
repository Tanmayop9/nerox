/**
 * Clear Warnings Command - Support Server Manager
 * Clear all warnings for a user
 */

export default {
    name: 'clearwarns',
    aliases: ['cw', 'clearwarnings'],
    description: 'Clear all warnings for a user',
    ownerOnly: true,
    supportOnly: true,
    cooldown: 3,

    async execute(client, message, args) {
        const target = message.mentions.users.first() || 
            await client.users.fetch(args[0]).catch(() => null);

        if (!target) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} Please mention a user or provide a valid ID! 🔍`)
                ]
            });
        }

        const warnings = await client.db.warnings.get(target.id) || [];

        if (warnings.length === 0) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.info)
                        .setDescription(`${client.emoji.info} **${target.tag}** has no warnings to clear! 🌟`)
                ]
            });
        }

        await client.db.warnings.delete(target.id);

        await message.reply({
            embeds: [
                client.embed(client.colors.success)
                    .setDescription(
                        `${client.emoji.check} Cleared **${warnings.length}** warning(s) from **${target.tag}**! 🗑️\n\n` +
                        `They now have a clean slate~ ✨`
                    )
            ]
        });

        // Log the action
        await client.db.logs.set(`clearwarn_${Date.now()}`, {
            type: 'clearwarns',
            target: target.id,
            moderator: message.author.id,
            count: warnings.length,
            timestamp: Date.now(),
        });
    }
};
