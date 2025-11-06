
export const generatePlayEmbed = (client, player) => {
    const track = player.queue.current;
    if (!track)
        return client.embed().desc('Lavalink could not provide track details.');
    
    const { title, author } = track;
    const duration = track.isStream ? `LIVE STREAM` : client.formatDuration(track.length || 369);
    
    const embed = client
        .embed('#FF69B4')
        .setAuthor({ 
            name: `${client.emoji.music || '🎵'} Now Playing`,
            iconURL: client.user.displayAvatarURL()
        })
        .title(title.length > 50 ? title.substring(0, 50) + '...' : title)
        .desc(
            `**Artist:** ${author}\n` +
            `**Duration:** ${duration}\n` +
            `**Requested by:** ${track.requester.displayName}`
        )
        .footer({
            text: `Queue: ${player.queue.size} track${player.queue.size !== 1 ? 's' : ''} • Volume: ${player.volume}%`,
            iconURL: track.requester.displayAvatarURL()
        })
        .setTimestamp();
    
    return embed;
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
