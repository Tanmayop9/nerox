import { Command } from '../../classes/abstract/command.js';
import { inspect } from 'util';

export default class JSKJS extends Command {
    constructor() {
        super();
        this.aliases = ['nerox js'];
        this.description = 'Evaluates JavaScript code.';
        this.owner = true;
    }

    execute = async (client, ctx) => {
        const code = ctx.args.join(' ');
        const { info, info1, check, cross } = client.emoji;

        if (!code) {
            return ctx.reply({
                embeds: [
                    client.embed()
                        .title(`${cross} Missing Code`)
                        .desc(`${info1} You need to provide JavaScript code to evaluate.`)
                        .footer({ text: `Requested by ${ctx.author.username}`, iconURL: ctx.author.displayAvatarURL() })
                ]
            });
        }

        try {
            let result = eval(code);
            if (typeof result !== 'string') {
                result = inspect(result, { depth: 2 });
            }

            const embed = client.embed()
                .title(`${check} JavaScript Evaluation`)
                .desc(`\`\`\`js\n${result}\n\`\`\``)
                .footer({ text: `Requested by ${ctx.author.username}`, iconURL: ctx.author.displayAvatarURL() });

            await ctx.reply({ embeds: [embed] });

        } catch (err) {
            const errorEmbed = client.embed()
                .title(`${cross} Error While Evaluating`)
                .desc(`\`\`\`js\n${err.stack || err.message || err}\n\`\`\``)
                .footer({ text: `Requested by ${ctx.author.username}`, iconURL: ctx.author.displayAvatarURL() });

            await ctx.reply({ embeds: [errorEmbed] });
        }
    };
}