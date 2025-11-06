const event = 'underMaintenance';
export default class UnderMaintenance {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx) => {
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`**SERVICE TEMPORARILY UNAVAILABLE**\n\n` +
                            `${client.emoji.cross} The bot is currently undergoing maintenance.\n` +
                            `${client.emoji.warn} Our engineers are working tirelessly to bring it back.\n\n` +
                            `${client.emoji.info} For updates, join our **[Support Server](${client.config.links.support})**.\n` +
                            `${client.emoji.info} We appreciate your patience!`),
                ],
            });
        };
    }
}