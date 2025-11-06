import { Command } from '../../classes/abstract/command.js';
import fs from 'fs';
import path from 'path';

export default class JSKCat extends Command {
    constructor() {
        super();
        this.aliases = ['nerox cat'];
        this.description = 'Displays contents of logs.txt file.';
        this.owner = true;
    }

    execute = async (client, ctx) => {
        try {
            const logPath = path.resolve('logs.txt');
            if (!fs.existsSync(logPath)) {
                return ctx.reply({
                    embeds: [
                        client.embed()
                            .title(`${client.emoji.info1} File Not Found`)
                            .desc(`The file \`logs.txt\` does not exist.`)
                    ]
                });
            }

            const content = fs.readFileSync(logPath, 'utf8');
            const sliced = content.length > 4000 ? content.slice(-4000) : content; // Discord limit

            const embed = client.embed()
                .title(`${client.emoji.info} logs.txt Content`)
                .desc(`\`\`\`\n${sliced || 'File is empty.'}\n\`\`\``)
                .footer({ text: `Requested by ${ctx.author.username}`, iconURL: ctx.author.displayAvatarURL() });

            await ctx.reply({ embeds: [embed] });

        } catch (err) {
            await ctx.reply({
                embeds: [
                    client.embed()
                        .title('❌ Error Reading File')
                        .desc(`\`\`\`\n${err.message || err}\n\`\`\``)
                ]
            });
        }
    };
}