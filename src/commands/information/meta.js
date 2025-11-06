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
				embeds: [client.embed('#1DB954')
					.setTitle('📊 Collecting Statistics...')
					.desc('> 🔍 Analyzing codebase structure\n> 📂 Scanning files and directories\n> 📝 Counting lines of code')
				],
			});

			const stats = await getCodeStats();

			const info = [
				`╭─────────────────────────────╮`,
				`│   **📊 Codebase Overview**  │`,
				`╰─────────────────────────────╯\n`,
				`**📁 Structure**`,
				`> 📂 **Total Files:** \`${stats.files}\``,
				`> 📁 **Directories:** \`${stats.directories}\`\n`,
				`**📝 Code Metrics**`,
				`> 📄 **Total Lines:** \`${stats.lines.toLocaleString()}\``,
				`> 🔤 **Characters:** \`${stats.characters.toLocaleString()}\``,
				`> ⬜ **Whitespaces:** \`${stats.whitespaces.toLocaleString()}\`\n`,
				`**📈 Statistics**`,
				`> 📊 **Avg Lines/File:** \`${Math.floor(stats.lines / stats.files)}\``,
				`> 📦 **Total Size:** \`${(stats.characters / 1024 / 1024).toFixed(2)} MB\``,
			];

			const embeds = [
				client.embed('#1DB954')
					.setAuthor({ 
						name: `${client.user.username} - Codebase Statistics`,
						iconURL: client.user.displayAvatarURL()
					})
					.setThumbnail(client.user.displayAvatarURL())
					.desc(info.join('\n'))
					.footer({ 
						text: `Page 1/${Math.ceil(stats.tree.length / 20) + 1} • Developed by NeroX Studios`,
						iconURL: ctx.author.displayAvatarURL()
					})
					.setTimestamp()
			];

			const treeChunks = _.chunk(stats.tree, 20);
			let pageNum = 2;
			for (const chunk of treeChunks) {
				embeds.push(
					client.embed('#1DB954')
						.setAuthor({ 
							name: `${client.user.username} - Directory Tree`,
							iconURL: client.user.displayAvatarURL()
						})
						.setTitle('🌳 Project Structure')
						.desc(`\`\`\`bash\n${chunk.join('\n')}\n\`\`\``)
						.footer({ 
							text: `Page ${pageNum}/${treeChunks.length + 1} • Directory Tree`,
							iconURL: ctx.author.displayAvatarURL()
						})
						.setTimestamp()
				);
				pageNum++;
			}

			await paginator(ctx, embeds);
			await msg.delete().catch(() => {});
		};
	}
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */