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
                name: `✨ ${client.user.username} Stats`,
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
                `Hey there! Here's how I'm doing~ 💖\n\n` +
                `I'm the **NeroX Support Manager**, helping to keep everything running smoothly ` +
                `in the support server! I've been awake for **${uptime}** and using **${memUsage} MB** of memory. 🌟\n\n` +
                `**📊 Database Stats**\n` +
                `Currently managing **${noPrefixCount}** no-prefix users and **${premiumCount}** premium subscribers! ` +
                `That's a lot of happy users~ ✨\n\n` +
                `**🎉 Giveaway Stats**\n` +
                `There are **${activeGiveaways}** active giveaway${activeGiveaways !== 1 ? 's' : ''} running right now, ` +
                `and I've successfully completed **${endedGiveaways}** giveaway${endedGiveaways !== 1 ? 's' : ''}! ` +
                `${activeGiveaways > 0 ? 'Join one now to win amazing prizes! 🎁' : 'Stay tuned for the next one! 🌸'}\n\n` +
                `**🖥️ System Info**\n` +
                `Running on **Node.js ${process.version}** with **${client.commands.size} commands** loaded! ` +
                `Latency is **${client.ws.ping}ms** - ${client.ws.ping < 100 ? 'super fast! 🚀' : 'doing great! ⚡'}`
            )
            .setFooter({ 
                text: `💖 Made with love • Requested by ${message.author.tag}`,
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
