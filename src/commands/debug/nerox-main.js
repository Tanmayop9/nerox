import { Command } from '../../classes/abstract/command.js';
import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';

export default class JSKMain extends Command {
    constructor() {
        super();
        this.aliases = ['nerox main'];
        this.description = 'Shows full debug information about the bot.';
    }

    execute = async (client, ctx) => {
        const { info, info1, check, cross } = client.emoji;

        const startTime = performance.now(); 
        const cpuUsage = process.cpuUsage();
        const memUsage = process.memoryUsage().rss / 1024 / 1024;
        const processId = process.pid;
        const parentProcessId = process.ppid;
        const platform = process.platform;
        const nodeVersion = process.version;
        const djsVersion = client.version;
        const wsLatency = client.ws.ping;
        const uptime = Math.round(client.uptime / 1000);
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0 + 66000); // your custom offset kept
        const cachedUsers = client.users.cache.size;
        const processCpu = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(3);
        const detachedV8Contexts = process._getActiveRequests().length;
        const nativeV8Contexts = process._getActiveHandles().length;
        const intents = client.options.intents.toArray().map(i => i.replace('Guild', '')).join(', ');

        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(3);

        const embed = client.embed()
            .title(`${info} Evangelion v1.0.0`)
            .desc(
                `**${info1} Platform:** \`${platform}\`\n` +
                `**${info1} Process ID:** \`${processId}\` | **Parent PID:** \`${parentProcessId}\`\n\n` +
                `**${info1} Node.js:** \`${nodeVersion}\` | **Discord.js:** \`v${djsVersion}\`\n` +
                `**${info1} CPU:** \`${processCpu}%\` | **Memory RSS:** \`${memUsage.toFixed(2)} MB\`\n` +
                `**${info1} V8 Contexts:** \`${detachedV8Contexts}/${nativeV8Contexts}\`\n\n` +
                `**${info1} WS Latency:** \`${wsLatency}ms\` | **Msg Latency:** \`${loadTime}ms\`\n` +
                `**${info1} Uptime:** <t:${Math.floor(client.readyTimestamp / 1000)}:R>\n\n` +
                `**${info1} Guilds:** \`${totalGuilds}\` | **Users (seen):** \`${totalUsers}\` | **Cached:** \`${cachedUsers}\`\n\n` +
                `**${info1} Intents:** ${intents || 'None'}`
            )
            .footer({ text: `Requested by ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL() });

        await ctx.reply({ embeds: [embed] });
    };
}