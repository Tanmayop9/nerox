import { Command } from '../../classes/abstract/command.js';
export default class Stop extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.description = 'Stops playing player';
        this.execute = async (client, ctx) => {
            await ctx.guild.members.me.voice.disconnect();
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.check} Stopped and destroyed the player.\n` +
                        ((await client.db?.twoFourSeven.has(ctx.guild.id)) ?
                            `${client.emoji.info} Disable 247 to prevent the bot from joining back.`
                            : ``)),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
