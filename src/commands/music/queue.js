import _ from 'lodash';
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';

export default class Queue extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['q'];
        this.description = 'Get player queue';
        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const current = player.queue.current;
            const previous = player.queue.previous;
            const upcoming = [...player.queue];
            
            const totalDuration = upcoming.reduce((acc, t) => acc + (t.length || 0), 0) + (current?.length || 0);
            const totalTracks = previous.length + 1 + upcoming.length;

            // Format queue items with cute styling
            const formatTrack = (track, index, isCurrent = false, isPrevious = false) => {
                const duration = track.isStream ? '🔴 LIVE' : client.formatDuration(track.length);
                const title = track.title.length > 35 ? track.title.substring(0, 32) + '...' : track.title;
                
                if (isCurrent) {
                    return `**▶️ ${index}. ${title}**\n└ \`${duration}\` • *Now Playing* 🎵`;
                }
                if (isPrevious) {
                    return `~~${index}. ${title}~~\n└ \`${duration}\` • *Already played* ✨`;
                }
                return `${index}. ${title}\n└ \`${duration}\` • *Up next* 🎶`;
            };

            // Build queue list
            const queueList = [];
            
            // Previous tracks
            previous.forEach((track, i) => {
                queueList.push(formatTrack(track, i, false, true));
            });
            
            // Current track
            if (current) {
                queueList.push(formatTrack(current, previous.length, true));
            }
            
            // Upcoming tracks
            upcoming.forEach((track, i) => {
                queueList.push(formatTrack(track, previous.length + 1 + i));
            });

            const chunked = _.chunk(queueList, 8);
            const pages = chunked.map((chunk, pageIndex) => 
                client.embed('#FF69B4')
                    .setAuthor({
                        name: `🎵 ${client.user.username}'s Queue`,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setThumbnail(current?.thumbnail || client.user.displayAvatarURL())
                    .desc(
                        `Here's what's playing and coming up! 💕\n\n` +
                        `Currently in the queue: **${totalTracks} track${totalTracks !== 1 ? 's' : ''}** ` +
                        `with a total duration of **${client.formatDuration(totalDuration)}**! 🎧\n\n` +
                        chunk.join('\n\n')
                    )
                    .footer({
                        text: `💖 Page ${pageIndex + 1}/${chunked.length} • Loop: ${player.loop || 'Off'} • Volume: ${player.volume}%`,
                        iconURL: ctx.author.displayAvatarURL()
                    })
                    .setTimestamp()
            );

            await paginator(ctx, pages, Math.floor(previous.length / 8) || 0);
        };
    }
}
