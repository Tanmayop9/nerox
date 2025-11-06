import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { filter } from '../../utils/filter.js';
import { Command } from '../../classes/abstract/command.js';

export default class Help extends Command {
	constructor() {
		super(...arguments);
		this.aliases = ['h'];
		this.description = 'Displays the sleek command dashboard.';
	}

	async execute(client, ctx) {
		const allCommands = client.commands.reduce((acc, cmd) => {
			if (['owner', 'mod', 'debug'].includes(cmd.category)) return acc;
			acc[cmd.category] ||= [];
			acc[cmd.category].push({
				name: cmd.name,
				description: cmd.description?.length > 25 
					? cmd.description.substring(0, 22) + '...' 
					: cmd.description || 'No description',
			});
			return acc;
		}, {});

		const categories = client.categories
			.sort((b, a) => b.length - a.length)
			.filter(category => !['owner', 'mod', 'debug'].includes(category));

		const totalCommands = client.commands.filter(cmd => !['owner', 'mod', 'debug'].includes(cmd.category)).size;

		const embed = client.embed('#1DB954')
			.setAuthor({ 
				name: `${client.user.username} Command Center`,
				iconURL: client.user.displayAvatarURL()
			})
			.setThumbnail(client.user.displayAvatarURL())
			.desc(
				`╭─────────────────────────────────╮\n` +
				`│  🎵 **Music Bot by NeroX Studios**  │\n` +
				`╰─────────────────────────────────╯\n\n` +
				`**📍 Quick Info**\n` +
				`> ${client.emoji.info} **Prefix:** \`${client.prefix}\`\n` +
				`> ${client.emoji.info} **Total Commands:** \`${totalCommands}\`\n` +
				`> ${client.emoji.info} **Categories:** \`${categories.length}\`\n\n` +
				`**📖 How to Use**\n` +
				`> Use \`${client.prefix}<command> -guide\` for command details\n\n` +
				`**🔰 Argument Guide**\n` +
				`> \`<>\` = Required\n` +
				`> \`[]\` = Optional\n\n` +
				`**🎯 Navigation**\n` +
				`> Select a category from the dropdown below to view commands!`
			)
			.footer({ 
				text: `Powered by NeroX Studios • ${client.guilds.cache.size} Servers`,
				iconURL: ctx.author.displayAvatarURL()
			})
			.setTimestamp();

		const categoryEmojis = {
			music: '🎵',
			information: 'ℹ️',
			premium: '⭐',
			ticket: '🎫'
		};

		const menu = new StringSelectMenuBuilder()
			.setCustomId('menu')
			.setPlaceholder('🎯 Select a category to explore commands')
			.setMaxValues(1)
			.addOptions([
				{
					label: '🏠 Home',
					value: 'home',
					description: 'Return to main menu',
					emoji: '🏠',
				},
				...categories.map(category => ({
					label: `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
					value: category,
					description: `View ${allCommands[category]?.length || 0} ${category} commands`,
					emoji: categoryEmojis[category] || '📂',
				})),
				{
					label: '📜 All Commands',
					value: 'all',
					description: 'View all available commands',
					emoji: '📜',
				},
			]);

		const reply = await ctx.reply({
			embeds: [embed],
			components: [new ActionRowBuilder().addComponents(menu)],
		});

		const collector = reply.createMessageComponentCollector({
			idle: 60000,
			filter: i => filter(i, ctx),
		});

		collector.on('collect', async interaction => {
			await interaction.deferUpdate();
			const selected = interaction.values[0];

			switch (selected) {
				case 'home':
					await reply.edit({ embeds: [embed] });
					break;

				case 'all':
					const allEmbed = client.embed('#1DB954')
						.setAuthor({ 
							name: `${client.user.username} - All Commands`,
							iconURL: client.user.displayAvatarURL()
						})
						.desc(
							Object.entries(allCommands)
								.sort((a, b) => a[0].localeCompare(b[0]))
								.map(([cat, cmds]) =>
									`**${categoryEmojis[cat] || '📂'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}** (\`${cmds.length}\`)\n` +
									`> ${cmds.map(cmd => `\`${cmd.name}\``).join(', ')}`
								).join('\n\n')
						)
						.footer({ 
							text: `Total: ${totalCommands} commands`,
							iconURL: ctx.author.displayAvatarURL()
						})
						.setTimestamp();
					await reply.edit({ embeds: [allEmbed] });
					break;

				default:
					const selectedCommands = allCommands[selected] || [];
					const categoryEmbed = client.embed('#1DB954')
						.setAuthor({ 
							name: `${client.user.username} - ${selected.charAt(0).toUpperCase() + selected.slice(1)} Commands`,
							iconURL: client.user.displayAvatarURL()
						})
						.setThumbnail(client.user.displayAvatarURL())
						.desc(
							selectedCommands.length
								? `**${categoryEmojis[selected] || '📂'} Available Commands (\`${selectedCommands.length}\`)**\n\n` +
								  selectedCommands.map(cmd =>
									`**\`${cmd.name.padEnd(12)}\`** • ${cmd.description}`
								  ).join('\n')
								: `${client.emoji.warn} No commands available in this category.`
						)
						.footer({ 
							text: `Use ${client.prefix}<command> -guide for detailed help`,
							iconURL: ctx.author.displayAvatarURL()
						})
						.setTimestamp();

					await reply.edit({ embeds: [categoryEmbed] });
					break;
			}
		});

		collector.on('end', async () => {
			menu.setDisabled(true);
			await reply.edit({ 
				components: [new ActionRowBuilder().addComponents(menu)] 
			}).catch(() => null);
		});
	}
}