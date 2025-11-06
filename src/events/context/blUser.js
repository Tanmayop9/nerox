
import moment from 'moment-timezone';
import { ActionRowBuilder } from 'discord.js';
const event = 'blUser';
export default class BlacklistUser {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx) => {
            await client.db.blacklist.set(ctx.author.id, true);
            const replyObject = {
                embeds: [
                    client
                        .embed('#000000')
                        .desc(`**Listen up ${ctx.author},**\n\n` +
                        `${client.emoji.bl} You’ve been flagged and blacklisted by my anti-spam system.\n` +
                        `${client.emoji.info} Don’t even bother, but if you wanna beg for mercy, open a ticket @ my **[\`Support Server\`](${client.config.links.support})**.`),
                ],
                components: [
                    new ActionRowBuilder().addComponents(client.button().link('Support Server', client.config.links.support)),
                ],
            };
            await ctx.react(client.emoji.bl, {
                content: 'You’ve been flagged and blacklisted by my anti-spam system!!!\n' +
                    'Check your DMs, loser. 🙄',
            });
            await ctx.author.send(replyObject).catch(() => null);
            await client.webhooks.blLogs.send({
                username: `Auto-blacklist-logs`,
                avatarURL: `${client.user?.displayAvatarURL()}`,
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.bl} A poor soul got blacklisted (${moment().tz('Asia/Kolkata')})\n\n` +
                        `${client.emoji.info} **User :** ${ctx.author.tag} \`[${ctx.author.id}]\`\n` +
                        `${client.emoji.info} **Guild :** ${ctx.guild.name.substring(0, 20)} \`[${ctx.guild.id}]\`\n` +
                        `${client.emoji.info} **Channel :** ${ctx.channel.name} \`[${ctx.channel.id}]\``),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */