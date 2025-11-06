import { Command } from '../../classes/abstract/command.js';

export default class JSKRTT extends Command {
    constructor() {
        super();
        this.aliases = ['nerox rtt'];
        this.description = 'Shows real-time bot latency.';
        this.owner = true;
    }

    execute = async (client, ctx) => {
        const startTime = Date.now();

        const loadingEmbed = client.embed()
            .title(`${client.emoji.info} Calculating Latency...`)
            .desc(`Please wait while we measure the bot's response time.`)
            .footer({ text: `Requested by ${ctx.author.username}`, iconURL: ctx.author.displayAvatarURL() });

        const msg = await ctx.reply({ embeds: [loadingEmbed] });

        const endTime = Date.now();
        const messageLatency = endTime - startTime;
        const wsLatency = client.ws.ping;

        const finalEmbed = client.embed()
            .title(`${client.emoji.info1} Real-Time Latency`)
            .desc(
                `> ${client.emoji.info} **WebSocket Latency:** \`${wsLatency}ms\`\n` +
                `> ${client.emoji.info1} **Message Latency:** \`${messageLatency}ms\``
            )
            .footer({ text: `Latency checked at`, iconURL: ctx.author.displayAvatarURL() });

        msg.edit({ embeds: [finalEmbed] });
    };
}