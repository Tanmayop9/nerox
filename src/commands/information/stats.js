/**
 * @fuego v1.0.0
 * @author painfuego
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { Command } from '../../classes/abstract/command.js';
import { paginator } from '../../utils/paginator.js';

export default class Stats extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['status', 'botinfo'];
        this.description = 'Displays bot statistics with navigation.';
        this.execute = async (client, ctx) => {
            const pages = await this.getStatsPages(client, ctx);
            await paginator(ctx, pages);
        };
    }

    async getStatsPages(client, ctx) {
        const totalUsers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
        const cpuUsage = (await import('os-utils')).default.cpuUsage;
        const _cpuUsage = await new Promise((resolve) => cpuUsage(resolve));

        const generalStatsEmbed = client.embed('#1DB954')
            .setAuthor({
                name: `${client.user.username} Statistics`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('📊 General Statistics')
            .setDescription(
                `╭─────────────────────────────╮\n` +
                `│     **Bot Performance**     │\n` +
                `╰─────────────────────────────╯\n\n` +
                `**🌐 Network Stats**\n` +
                `> ${client.emoji.info} **Servers:** \`${client.guilds.cache.size.toLocaleString()}\`\n` +
                `> ${client.emoji.info} **Users:** \`${totalUsers.toLocaleString()}\`\n` +
                `> ${client.emoji.info} **Channels:** \`${client.channels.cache.size.toLocaleString()}\`\n\n` +
                `**⏱️ Runtime Info**\n` +
                `> ${client.emoji.timer} **Uptime:** \`${client.formatDuration(client.uptime)}\`\n` +
                `> ${client.emoji.info} **Ping:** \`${client.ws.ping}ms\`\n\n` +
                `**💾 Memory Usage**\n` +
                `> ${client.emoji.info} **RSS:** \`${client.formatBytes(process.memoryUsage().rss)}\`\n` +
                `> ${client.emoji.info} **Heap Used:** \`${client.formatBytes(process.memoryUsage().heapUsed)}\`\n` +
                `> ${client.emoji.info} **Heap Total:** \`${client.formatBytes(process.memoryUsage().heapTotal)}\`\n` +
                `> ${client.emoji.info} **External:** \`${client.formatBytes(process.memoryUsage().external)}\`\n\n` +
                `**🎵 Music Stats**\n` +
                `> ${client.emoji.info} **Active Players:** \`${client.manager.players.size}\``
            )
            .footer({ 
                text: `Page 1/3 • Requested by ${ctx.author.tag}`,
                iconURL: ctx.author.displayAvatarURL()
            })
            .setTimestamp();

        const shardInfo = await client.cluster.broadcastEval(
            (c) => ({
                id: c.ws.shards.first().id,
                ping: c.ws.ping,
                guilds: c.guilds.cache.size,
                status: c.ws.status
            })
        );

        const shardInfoEmbed = client.embed('#1DB954')
            .setAuthor({
                name: `${client.user.username} Shard Information`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('🔗 Shard Statistics')
            .setDescription(
                `╭─────────────────────────────╮\n` +
                `│      **Shard Details**      │\n` +
                `╰─────────────────────────────╯\n\n` +
                (shardInfo.length > 0
                    ? shardInfo.map(shard => 
                        `**Shard ${shard.id}**\n` +
                        `> 📡 **Ping:** \`${shard.ping}ms\`\n` +
                        `> 🏢 **Guilds:** \`${shard.guilds}\`\n` +
                        `> 🟢 **Status:** \`${shard.status === 0 ? 'Ready' : 'Connecting'}\``
                    ).join('\n\n')
                    : `${client.emoji.warn} No shard information available.`)
            )
            .footer({ 
                text: `Page 2/3 • Total Shards: ${shardInfo.length}`,
                iconURL: ctx.author.displayAvatarURL()
            })
            .setTimestamp();

        const systemInfoEmbed = client.embed('#1DB954')
            .setAuthor({
                name: `${client.user.username} System Information`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setTitle('⚙️ System Statistics')
            .setDescription(
                `╭─────────────────────────────╮\n` +
                `│    **System Resources**     │\n` +
                `╰─────────────────────────────╯\n\n` +
                `**🖥️ Hardware**\n` +
                `> ${client.emoji.info} **CPU Usage:** \`${(_cpuUsage * 100).toFixed(2)}%\`\n` +
                `> ${client.emoji.info} **RAM Usage:** \`${client.formatBytes(process.memoryUsage().rss)}\`\n` +
                `> ${client.emoji.info} **Platform:** \`${process.platform}\`\n` +
                `> ${client.emoji.info} **Architecture:** \`${process.arch}\`\n\n` +
                `**📦 Software**\n` +
                `> ${client.emoji.info} **Node.js:** \`${process.version}\`\n` +
                `> ${client.emoji.info} **Discord.js:** \`v14.15.2\`\n` +
                `> ${client.emoji.info} **Process ID:** \`${process.pid}\`\n\n` +
                `**📊 Performance**\n` +
                `> ${client.emoji.info} **Commands:** \`${client.commands.size}\`\n` +
                `> ${client.emoji.info} **Events:** \`${client.eventNames().length}\``
            )
            .footer({ 
                text: `Page 3/3 • Bot Version: v1.0.0`,
                iconURL: ctx.author.displayAvatarURL()
            })
            .setTimestamp();

        return [generalStatsEmbed, shardInfoEmbed, systemInfoEmbed];
    }
}