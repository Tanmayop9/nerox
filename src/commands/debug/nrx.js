import { Command } from '../../classes/abstract/command.js';

export default class JSK extends Command {
    constructor() {
        super();
        this.description = 'Lists all JSK debug commands.';
    }

    execute = async (client, ctx) => {
        const embed = client.embed()
            .title('Debug Commands')
            .desc(
                `${client.emoji.info}**\`nerox main\`** - Shows full debug information.\n` +
                `${client.emoji.info}**\`nerox js <code>\`** - Evaluates JavaScript code.\n` +
                `${client.emoji.info}**\`nerox cat\`** - Displays bot logs.\n` +
                `${client.emoji.info}**\`nerox sh <cmd>\`** - Executes shell commands.\n` +
                `${client.emoji.info}**\`nerox rtt\`** - Shows real-time latency.`
            )
            .footer({ text: `Requested by ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL() });

        await ctx.reply({ embeds: [embed] });
    };
}