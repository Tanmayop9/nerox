/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';
export default class Profile extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['pr'];
        this.description = 'Shows user profile';
        this.execute = async (client, ctx) => {
            let [commandsUsed, songsPlayed] = await Promise.all([
                client.db.stats.commandsUsed.get(ctx.author.id),
                client.db.stats.songsPlayed.get(ctx.author.id),
            ]);
            songsPlayed ||= 0;
            commandsUsed ||= 0;
            const achievements = {
                commands: [],
                songs: [],
            };
            const challenges = {
                commands: {
                    'basic user': { count: 10, emoji: client.emoji.check },
                    'junior user': { count: 50, emoji: client.emoji.check },
                    'senior user': { count: 100, emoji: client.emoji.check },
                    'master user': { count: 500, emoji: client.emoji.check },
                    'unhinged user': { count: 1000, emoji: client.emoji.check },
                },
                songsPlayed: {
                    'basic listener': { count: 10, emoji: client.emoji.check },
                    'junior listener': { count: 50, emoji: client.emoji.check },
                    'senior listener': { count: 100, emoji: client.emoji.check },
                    'master listener': { count: 500, emoji: client.emoji.check },
                    'unhinged listener': { count: 1000, emoji: client.emoji.check },
                },
            };
            Object.entries(challenges.commands).forEach(([key, { count }]) => {
                const achievement = key.charAt(0).toUpperCase() + key.slice(1);
                achievements.commands.push(commandsUsed >= count ?
                    `${client.emoji.check} **${achievement} :** Complete ( ${count} / ${count} )`
                    : `${client.emoji.info} **${achievement} :** Progress ( ${commandsUsed} / ${count} )`);
            });
            Object.entries(challenges.songsPlayed).forEach(([key, { count }]) => {
                const achievement = key.charAt(0).toUpperCase() + key.slice(1);
                achievements.songs.push(songsPlayed >= count ?
                    `${client.emoji.check} **${achievement} :** Complete ( ${count} / ${count} )`
                    : `${client.emoji.info} **${achievement} :** Progress ( ${songsPlayed} / ${count} )`);
            });
            const badges = [];
            if (client.owners.includes(ctx.author.id) ||
                client.admins.includes(ctx.author.id) ||
                (await client.db.noPrefix.has(ctx.author.id)))
                badges.push(`${client.emoji.check} **No Prefix** (Pay to get it)`);
            if (ctx.author.id === '1056087251068649522')
                badges.push(`${client.emoji.check} **Developer** (Only for me)`);
            if (client.admins.includes(ctx.author.id))
                badges.push(`${client.emoji.check} **Admin** (Only for bot admins)`);
            if (client.owners.includes(ctx.author.id))
                badges.push(`${client.emoji.check} **Owner** (Only for bot owners)`);
            for (const [key, value] of Object.entries(challenges.commands))
                if (commandsUsed >= value.count)
                    badges.push(`${value.emoji} **${key[0].toUpperCase() + key.slice(1)}** (Use any command/s ${value.count} times)`);
            for (const [key, value] of Object.entries(challenges.songsPlayed))
                if (songsPlayed >= value.count)
                    badges.push(`${value.emoji} **${key[0].toUpperCase() + key.slice(1)}** (Listen to any song/s ${value.count} times)`);
            const achievementsEmbed = client
                .embed()
                .setAuthor({
                name: ctx.author.username,
                iconURL: ctx.author.displayAvatarURL(),
            })
                .desc(Object.entries(achievements)
                .map(([key, value]) => `${client.emoji.check} **${key[0].toUpperCase() + key.slice(1)} :**\n\n` +
                `${value.join('\n')}`)
                .join('\n\n'));
            const badgesEmbed = client
                .embed()
                .setAuthor({
                name: ctx.author.username,
                iconURL: ctx.author.displayAvatarURL(),
            })
                .desc(badges.length ?
                badges.join('\n')
                : `${client.emoji.warn} **Oops ! You don't have any badges.**\n` +
                    `${client.emoji.info} Scroll to the next page to view your completed achievements and progress of incomplete ones.\n` +
                    `${client.emoji.info} You can complete achievements and collect badges that will be displayed on this page.`);
            await paginator(ctx, [badgesEmbed, achievementsEmbed]);
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
