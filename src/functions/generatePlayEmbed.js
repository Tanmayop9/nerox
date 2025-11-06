
export const generatePlayEmbed = (client, player) => {
    const track = player.queue.current;
    if (!track)
        return client.embed().desc('Lavalink could not provide track details.');
    const { title, author } = track;
    const duration = track.isStream ? `◉ LiVE STREAM` : client.formatDuration(track.length || 369);
    const embed = client
        .embed()
        .title(title.substring(0, 40))
        .desc(`${client.emoji.info} Duration: ${duration}\n` + `${client.emoji.info} Author: ${author}`)
      
        .footer({
        text: `Track requested by ${track.requester.displayName}`,
    });
    // if (track.thumbnail) embed.img(track.thumbnail?.replace('hqdefault', 'maxresdefault'));
    return embed;
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
