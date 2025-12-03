import { ActionRowBuilder } from 'discord.js';
import { Command } from '../../classes/abstract/command.js';

export default class Invite extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['inv'];
        this.description = 'Shows my invite links';
        this.execute = async (client, ctx) => {
            const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
            const activePlayers = client.manager?.players?.size || 0;

            await ctx.reply({
                embeds: [
                    client.embed('#FF69B4')
                        .setAuthor({
                            name: `💌 Invite ${client.user.username}`,
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setThumbnail(client.user.displayAvatarURL())
                        .desc(
                            `Hey there! Want to bring me to your server? 🥰\n\n` +
                            `I'm currently spreading music and joy in **${client.guilds.cache.size.toLocaleString()} servers** ` +
                            `with **${totalUsers.toLocaleString()} happy users**! Right now, **${activePlayers} player${activePlayers !== 1 ? 's are' : ' is'}** ` +
                            `enjoying tunes with me! 🎵\n\n` +
                            `**🎀 Which invite should you pick?**\n` +
                            `• **Administrator** - Recommended! Gives me all the permissions I need to work smoothly~ ✨\n` +
                            `• **Basic** - Just the essentials, but some features might be limited! 🔧\n\n` +
                            `Click a button below to add me to your server! I promise to be a good bot~ 💕`
                        )
                        .footer({ 
                            text: '💖 Thank you for considering me!',
                            iconURL: ctx.author.displayAvatarURL()
                        })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder().addComponents([
                        client.button().link('✨ Administrator', client.invite.admin()),
                        client.button().link('🔧 Basic Perms', client.invite.required()),
                    ]),
                ],
            });
        };
    }
}
