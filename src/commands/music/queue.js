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
            const previous = player.queue.previous.map((t, i) => `${i} • ${t.title.substring(0, 30)} - ${t.isStream ? 'LIVE' : client.formatDuration(t.length)}\n`);
            const upcoming = player.queue.map((t, i) => `${i + player.queue.previous.length + 1} • ${t.title.substring(0, 30)} - ${t.isStream ? 'LIVE' : client.formatDuration(t.length)}\n`);
            const current = `${player?.queue.previous.length} • ${player.queue.current.title.substring(0, 25)} - ${player.queue.current.isStream ?
                'LIVE'
                : client.formatDuration(player.queue.current.length)} ${client.emoji.check}\n`;
            const queuedSongs = [...previous, current, ...upcoming];
            const mapping = _.chunk(queuedSongs, 10);
            const descriptions = mapping.map((s) => s.join(''));
            const pages = [];
            for (let i = 0; i < descriptions.length; i++) {
                const embed = client.embed().desc(`${descriptions[i]}`);
                pages.push(embed);
            }
            await paginator(ctx, pages, Math.floor(previous.length / 10) || 0);
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
