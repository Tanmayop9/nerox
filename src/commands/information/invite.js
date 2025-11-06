import { ActionRowBuilder } from 'discord.js';
import { Command } from '../../classes/abstract/command.js';
export default class Invite extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['inv'];
        this.description = 'Shows my invite links';
        this.execute = async (client, ctx) => {
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.check} Click one of the buttons to add me.\n` +
                        `${client.emoji.info} Admin is recommended -> ease of use.`),
                ],
                components: [
                    new ActionRowBuilder().addComponents([
                        client.button().link('ㅤAdministratorㅤ', client.invite.admin()),
                        client.button().link('Basic ㅤ', client.invite.required()),
                    ]),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
