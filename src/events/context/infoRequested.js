const event = 'infoRequested';
export default class InfoRequested {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx, command) => {
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`### ${client.emoji.info1} **Information for the command \`${command.name}\`**\n\n` 
    +

                        `${client.emoji.info} **Desc: **${command.description}\n`  +                   `${client.emoji.info} **Aliases :** \`${`${command.aliases.join(', ')}` || 'No aliases found'}\`\n` +
                        `${client.emoji.info} **Usage :** ${client.prefix}${command.name} ${command.usage}\n`),
                ],
            });
        };
    }
}
