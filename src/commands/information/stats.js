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
        this.aliases = ['status'];
        this.description = 'Displays bot statistics with navigation.';
        this.execute = async (client, ctx) => {
            const pages = await this.getStatsPages(client);
            await paginator(ctx, pages);
        };
    }

    async getStatsPages(client) {
        const totalUsers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
        const cpuUsage = (await import('os-utils')).default.cpuUsage;
        const _cpuUsage = await new Promise((resolve) => cpuUsage(resolve));

        const generalStatsEmbed = client.embed()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTitle('📊 General Stats')
            .setDescription(
                `${client.emoji.info} **Servers** : ${client.guilds.cache.size.toLocaleString()}\n` +
                `${client.emoji.info} **Users** : ${totalUsers.toLocaleString()}\n` +
                `${client.emoji.timer} **Uptime** : ${client.formatDuration(client.uptime)}\n` +
                `${client.emoji.info} **Ping** : ${client.ws.ping}ms\n\n` +
                `**Memory Usage**\n` +
                `${client.emoji.info} **RSS** : ${client.formatBytes(process.memoryUsage().rss)}\n` +
                `${client.emoji.info} **Heap Used** : ${client.formatBytes(process.memoryUsage().heapUsed)}\n` +
                `${client.emoji.info} **Heap Total** : ${client.formatBytes(process.memoryUsage().heapTotal)}\n` +
                `${client.emoji.info} **External** : ${client.formatBytes(process.memoryUsage().external)}`
            );

        const shardInfoEmbed = client.embed()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTitle('🔗 Shard Info')
            .setDescription(
                (await client.cluster.broadcastEval(
                    (c) => `Shard ${c.ws.shards.first().id} - ${c.ws.ping}ms`
                )).join('\n') || `${client.emoji.warn} No shard info available.`
            );

        const systemInfoEmbed = client.embed()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL(),
            })
            .setTitle('⚙️ System Info')
            .setDescription(
                `${client.emoji.info} **CPU Usage** : ${_cpuUsage.toFixed(2)}% vCPU\n` +
                `${client.emoji.info} **RAM Usage** : ${client.formatBytes(process.memoryUsage().rss)}\n` +
                `${client.emoji.info} **Platform** : ${process.platform}\n` +
                `${client.emoji.info} **Node.js Version** : ${process.version}`
            );

        return [generalStatsEmbed, shardInfoEmbed, systemInfoEmbed];
    }
}