
import { limited } from '../../utils/ratelimiter.js';
const event = 'mention';
export default class Mention {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx) => {
            if (limited(ctx.author.id))
                return void client.emit('blUser', ctx);
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`Yo ${ctx.author}, welcome to your ultimate bot experience.\n\n` +
      `My global prefix is **\`${client.prefix}\`** – stay ahead, stay smooth.\n` +
      `What’s the move today? Let’s make it iconic.\n\n` +
      `Hit **\`${client.prefix}help\`** and let’s roll.`),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
