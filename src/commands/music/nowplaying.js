import { Command } from '../../classes/abstract/command.js';

export default class NowPlaying extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['now', 'np'];
        this.description = 'Get current song info';
        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const track = player.queue.current;
            const position = player.position;
            const duration = track.length;
            
            // Create progress bar
            const progress = Math.round((position / duration) * 20);
            const progressBar = '▰'.repeat(progress) + '▱'.repeat(20 - progress);

            await ctx.reply({
                embeds: [
                    client.embed('#FF69B4')
                        .setAuthor({
                            name: `🎵 Now Playing`,
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setThumbnail(track.thumbnail || client.user.displayAvatarURL())
                        .desc(
                            `Currently vibing to this amazing track! 💕\n\n` +
                            `**${track.title}**\n` +
                            `by *${track.author}*\n\n` +
                            `${progressBar}\n` +
                            `\`${client.formatDuration(position)}\` / \`${track.isStream ? '🔴 LIVE' : client.formatDuration(duration)}\`\n\n` +
                            `${track.isStream ? '🔴 This is a live stream - enjoy the endless vibes!' : 
                                `🎧 ${Math.round((duration - position) / 1000 / 60)} minutes of music left to enjoy!`}`
                        )
                        .footer({
                            text: `💖 Requested by ${track.requester.displayName}`,
                            iconURL: track.requester.displayAvatarURL?.() || ctx.author.displayAvatarURL()
                        })
                        .setTimestamp()
                ],
            });
        };
    }
}
