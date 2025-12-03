/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */
import { Command } from '../../classes/abstract/command.js';
import { paginator } from '../../utils/paginator.js';

export default class Stats extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['status'];
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
        const activePlayers = client.manager?.players?.size || 0;
        const shardCount = client.options.shardCount || 1;

        const generalStatsEmbed = client.embed('#FF69B4')
            .setAuthor({
                name: `✨ ${client.user.username} Statistics`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .desc(
                `Hello there! Here's everything about me~ 💕\n\n` +
                `**🌐 Network & Reach**\n` +
                `I'm currently spreading joy in **${client.guilds.cache.size.toLocaleString()} servers** ` +
                `and keeping **${totalUsers.toLocaleString()} users** company! That's a lot of friends~ 🥰\n\n` +
                `**⏱️ Uptime & Performance**\n` +
                `I've been awake for **${client.formatDuration(client.uptime)}** and feeling fresh! ` +
                `My response time is around **${client.ws.ping}ms** - ${client.ws.ping < 100 ? 'super speedy! 🚀' : 'doing my best! 💪'}\n\n` +
                `**💾 Memory Stats**\n` +
                `Right now I'm using **${client.formatBytes(process.memoryUsage().heapUsed)}** of memory ` +
                `out of **${client.formatBytes(process.memoryUsage().heapTotal)}** available. ` +
                `Running smooth and steady! ✨\n\n` +
                `**🎵 Music Vibes**\n` +
                `Currently jamming in **${activePlayers} server${activePlayers !== 1 ? 's' : ''}**! ` +
                `${activePlayers > 0 ? 'The party never stops! 🎉' : 'Ready to play some tunes~ 🎶'}`
            )
            .footer({ 
                text: `Page 1/3 • Requested by ${ctx.author.tag} 💖`,
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

        const shardInfoEmbed = client.embed('#FF69B4')
            .setAuthor({
                name: `🔮 ${client.user.username} Shard Info`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .desc(
                `Let me tell you about my shards! 💎\n\n` +
                `I'm running on **${shardCount} shard${shardCount > 1 ? 's' : ''}** to handle all the love ` +
                `you give me! Each shard helps me stay responsive and fast~ ⚡\n\n` +
                (shardInfo.length > 0
                    ? shardInfo.map(shard => 
                        `**💠 Shard ${shard.id}**\n` +
                        `This shard is handling **${shard.guilds.toLocaleString()} servers** with a latency of ` +
                        `**${shard.ping}ms**! Status: **${shard.status === 0 ? '✅ Online & Ready' : '🔄 Connecting...'}**`
                    ).join('\n\n')
                    : `Hmm, I couldn't fetch shard details right now... 🤔`) +
                `\n\n` +
                `All my shards work together to give you the best experience! 🌟`
            )
            .footer({ 
                text: `Page 2/3 • Total Shards: ${shardInfo.length} 💜`,
                iconURL: ctx.author.displayAvatarURL()
            })
            .setTimestamp();

        const systemInfoEmbed = client.embed('#FF69B4')
            .setAuthor({
                name: `🖥️ ${client.user.username} System Info`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .desc(
                `Here's what's running under my hood! 🔧\n\n` +
                `**💻 Hardware**\n` +
                `My CPU is currently at **${(_cpuUsage * 100).toFixed(2)}%** usage - ` +
                `${_cpuUsage < 0.5 ? 'chilling and relaxed! 😌' : 'working hard for you! 💪'}\n` +
                `I'm using **${client.formatBytes(process.memoryUsage().rss)}** of RAM on a ` +
                `**${process.platform}** system with **${process.arch}** architecture! 🏗️\n\n` +
                `**📦 Software Stack**\n` +
                `Powered by **Node.js ${process.version}** and the amazing **Discord.js v14.15.2**! ` +
                `These tools help me be the best bot I can be~ 🌈\n\n` +
                `**📊 Bot Metrics**\n` +
                `I have **${client.commands.size} commands** ready to serve you and ` +
                `**${client.eventNames().length} event listeners** keeping me alert! ` +
                `My process ID is \`${process.pid}\` - that's my unique identifier! 🏷️\n\n` +
                `Everything is optimized just for you! 💕`
            )
            .footer({ 
                text: `Page 3/3 • Bot Version: v1.0.0 🎀`,
                iconURL: ctx.author.displayAvatarURL()
            })
            .setTimestamp();

        return [generalStatsEmbed, shardInfoEmbed, systemInfoEmbed];
    }
}
