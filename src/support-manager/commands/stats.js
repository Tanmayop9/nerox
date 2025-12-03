/**
 * Stats Command - Support Server Manager
 * Display support manager statistics
 */

export default {
    name: 'sstats',
    aliases: ['supportstats', 'managerstats'],
    description: 'Shows support manager stats',
    cooldown: 5,

    async execute(client, message) {
        const noPrefixCount = (await client.db.noPrefix.keys).length;
        const premiumCount = (await client.db.botstaff.keys).length;
        const giveawayKeys = await client.db.giveaways.keys;
        
        let activeGiveaways = 0;
        let endedGiveaways = 0;
        
        for (const key of giveawayKeys) {
            const gw = await client.db.giveaways.get(key);
            if (gw.ended) endedGiveaways++;
            else activeGiveaways++;
        }

        const uptime = formatUptime(client.uptime);
        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const embed = client.embed(client.colors.primary)
            .setAuthor({
                name: `${client.user.username} Stats`,
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
                `**Uptime:** ${uptime}\n` +
                `**Memory:** ${memUsage} MB\n` +
                `**Latency:** ${client.ws.ping}ms\n\n` +
                `**Database**\n` +
                `No-prefix users: ${noPrefixCount}\n` +
                `Premium users: ${premiumCount}\n\n` +
                `**Giveaways**\n` +
                `Active: ${activeGiveaways}\n` +
                `Completed: ${endedGiveaways}\n\n` +
                `**System**\n` +
                `Node.js: ${process.version}\n` +
                `Commands: ${client.commands.size}`
            )
            .setFooter({ 
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
