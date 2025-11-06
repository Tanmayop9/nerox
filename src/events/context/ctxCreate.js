import { execute } from '../../functions/context/execute.js';
import { resolveNsfw } from '../../functions/context/resolveNsfw.js';
import { resolvePerms } from '../../functions/context/resolvePerms.js';
import { enforceAdmin } from '../../functions/context/enforceAdmin.js';
import { resolveVoice } from '../../functions/context/resolveVoice.js';
import { resolvePlayer } from '../../functions/context/resolvePlayer.js';
import { isUnderCooldown } from '../../functions/context/checkCooldown.js';
import { resolvePrefix } from '../../functions/context/resolvePrefix.js';
import { resolveCommand } from '../../functions/context/resolveCommand.js';
import { resolveBotAdmin } from '../../functions/context/resolveBotAdmin.js';

const event = 'ctxCreate';

export default class ContextCreate {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx) => {
            if (!ctx) return;

            const [owner, admin, noPrefix, bl, staff] = await Promise.all([
                client.owners.includes(ctx.author.id),
                client.admins.includes(ctx.author.id),
                client.db.noPrefix.get(ctx.author.id),
                client.db.blacklist.get(ctx.author.id),
                client.db.botstaff.has(ctx.author.id), // Premium Users
            ]);

            const botAdmin = owner || admin ? true : false;
            const np = botAdmin || noPrefix ? true : false;

            if (bl) return;
            if (!(await resolvePerms.basic(ctx))) return;
            if (ctx.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return void client.emit('mention', ctx);

            const resolvedPrefix = await resolvePrefix(ctx, np);
            if (resolvedPrefix === null) return;

            const { command, args } = await resolveCommand(ctx, resolvedPrefix);
            if (!command) return;

            if (!botAdmin && (await isUnderCooldown(ctx, command))) return;
            if (!(await enforceAdmin(ctx))) return;
            if (!(await resolvePerms.user(ctx, command, botAdmin))) return;
            if (!(await resolveBotAdmin(ctx, command))) return;

            // Premium users can use the bot during maintenance
            if (client.underMaintenance && !(botAdmin || staff)) return void client.emit('underMaintenance', ctx);

            if (args[0]?.toLowerCase() === '-guide') return void client.emit('infoRequested', ctx, command);
            if (!(await resolveVoice(ctx, command))) return;
            if (!(await resolvePlayer(ctx, command))) return;
            if (!(await resolveNsfw(ctx, command))) return;

            await execute(ctx, command, args);
        };
    }
}

/**@codeStyle - https://google.github.io/styleguide/tsguide.html */