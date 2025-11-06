
import apple from 'kazagumo-apple';
import deezer from 'kazagumo-deezer';
import { Connectors } from 'shoukaku';
import spotify from 'kazagumo-spotify';
import { Kazagumo, Plugins } from 'kazagumo';
import { autoplay } from '../functions/autoplay.js';
export class Manager {
    static { this.init = (client) => {
        const manager = new Kazagumo({
            plugins: [
                new deezer(),
                new apple({
                    imageWidth: 600,
                    imageHeight: 900,
                    countryCode: 'us',
                }),
                new spotify({
                    searchLimit: 10,
                    albumPageLimit: 1,
                    searchMarket: 'IN',
                    playlistPageLimit: 1,
                    clientId: 'd62dc6e25a374aad8f035111f351ea85',
                    clientSecret: 'c807e75e805d4001be9fd81e4afd6272',
                }),
                new Plugins.PlayerMoved(client),
            ],
            defaultSearchEngine: 'youtube',
            send: (guildId, payload) => client.guilds.cache.get(guildId)?.shard.send(payload),
        }, new Connectors.DiscordJS(client), [
            {
                secure: false,
                auth: 'Atom1',
                url: '98.83.6.213:25570',
                name: 'nerox-lava',
            },
        ], {
            userAgent: `@painfuego/fuego/v1.0.0/21_N-2K021-ST`,
        });
        manager.on('playerStuck', async (player) => await player.destroy());
        manager.on('playerException', async (player) => await player.destroy());
        manager.on('playerStart', (...args) => client.emit('trackStart', ...args));
        manager.on('playerDestroy', (...args) => client.emit('playerDestroy', ...args));
        manager.shoukaku.on('error', (_, error) => client.log(JSON.stringify(error), 'error'));
        manager.shoukaku.on('ready', (name) => client.log(`Node : ${name} connected`, 'success'));
        // track end
        manager.on('playerEnd', async (player) => await player.data.get('playEmbed')?.delete());
        // queue end
        manager.on('playerEmpty', async (player) => player.data.get('autoplayStatus') ? await autoplay(client, player) : await player.destroy());
        return manager;
    }; }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
