/**
 * @nerox v1.0.0
 * @author Tanmay
 */
import _ from 'lodash';
import { Command } from '../../classes/abstract/command.js';
import { paginator } from '../../utils/paginator.js';
import { getCodeStats } from '../../utils/codestats.js';

export default class CodeStats extends Command {
	constructor() {
		super(...arguments);
		this.dev = true;
		this.aliases = ['codestats', 'cs', 'codeinfo'];
		this.description = 'View full details about the bot\'s codebase.';
		this.execute = async (client, ctx) => {
			const msg = await ctx.reply({
				content: `collecting code statistics, please wait...`,
			});

			const stats = await getCodeStats();

			const info = [
				`• **Total Files:** \`${stats.files}\``,
				`• **Total Directories:** \`${stats.directories}\``,
				`• **Total Lines:** \`${stats.lines}\``,
				`• **Characters:** \`${stats.characters.toLocaleString()}\``,
				`• **Whitespaces:** \`${stats.whitespaces}\``,
			];

			const embeds = [
				client.embed()
					.setTitle(`Codebase Statistics`)
					.desc(info.join('\n')),
			];

			const treeChunks = _.chunk(stats.tree, 20);
			for (const chunk of treeChunks) {
				embeds.push(
					client.embed()
						.setTitle(` Code Tree`)
						.desc(`\`\`\`bash\n${chunk.join('\n')}\n\`\`\``)
				);
			}

			await paginator(ctx, embeds);
			await msg.delete().catch(() => {});
		};
	}
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */