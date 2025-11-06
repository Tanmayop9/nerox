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
                            `🔓 **Want uninterrupted access?**\n` +
                            `${client.emoji.info} Upgrade to **Premium** and bypass maintenance downtime!\n` +
                            `${client.emoji.info} **[Get Premium Now](${client.config.links.support})** and enjoy exclusive perks.\n\n` +
                            `${client.emoji.info} For updates, join our **[Support Server](${client.config.links.support})**.`),
                ],
            });
        };
    }
}