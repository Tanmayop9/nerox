
import moment from 'moment-timezone';
import { ActionRowBuilder } from 'discord.js';
const event = 'guildDelete';
export default class GuildDelete {
    constructor() {
        this.name = event;
        this.execute = async (client, guild) => {
            if (!guild?.name)
                return;
            const owner = await client.users.fetch(guild.ownerId, { force: true }).catch(() => null);
            await client.db?.twoFourSeven.delete(guild.id);
            await owner
                ?.send({
                embeds: [
                    client
                        .embed('Red')
                        .title(`Oops! ${client.user.username} was removed!`)
                        .desc(`${client.emoji.warn} ${client.user} was just removed from \`${guild.name}\`.\n\n` +
                        `${client.emoji.info} Sorry for all and any of the bad experience/(s) you had with me!\n\n` +
                        `${client.emoji.info} Please leave a feedback or report any issues you had at my **[\`Support Server\`](${client.config.links.support})** so that it can be fixed / worked on as soon as possible.`),
                ],
                components: [
                    new ActionRowBuilder().addComponents(client.button().link('Support Server', `${client.config.links.support}`), client.button().link('Add me back', `${client.invite.required()}`)),
                ],
            })
                .catch(() => null);
            await client.webhooks.serverchuda.send({
                username: `GuildLeave-logs`,
                avatarURL: `${client.user?.displayAvatarURL()}`,
                embeds: [
                    client
                        .embed('Red')
                        .desc(`${client.emoji.warn} **Left a guild (${moment().tz('Asia/Kolkata')})**\n\n` +
                        `**${guild.name}**\n\n` +
                        `${client.emoji.info} **Membercount :** ${guild.memberCount}\n` +
                        `${client.emoji.info} **GuildId :** ${guild.id}\n` +
                        `${client.emoji.info} **Owner :** ${owner?.displayName} \`[${guild.ownerId}]\`\n`),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
