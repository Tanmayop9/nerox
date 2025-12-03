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
		const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
		const activePlayers = client.manager?.players?.size || 0;

		const embed = client.embed('#FF69B4')
			.setAuthor({ 
				name: `✨ ${client.user.username} Help Center`,
				iconURL: client.user.displayAvatarURL()
			})
			.setThumbnail(client.user.displayAvatarURL())
			.desc(
				`Hey there, lovely! Welcome to my help center~ 💕\n\n` +
				`I'm **${client.user.username}**, your adorable music companion! Currently, I'm hanging out in ` +
				`**${client.guilds.cache.size.toLocaleString()} servers** with **${totalUsers.toLocaleString()} amazing users**, ` +
				`and right now **${activePlayers} player${activePlayers !== 1 ? 's are' : ' is'}** enjoying music! 🎵\n\n` +
				`**🎀 Quick Start Guide**\n` +
				`My prefix is \`${client.prefix}\` - just type it before any command!\n` +
				`I have **${totalCommands} commands** across **${categories.length} categories** ready for you~ ✨\n\n` +
				`**📖 Need Help with a Command?**\n` +
				`Use \`${client.prefix}<command> -guide\` to learn more about any command!\n\n` +
				`**🔮 Argument Types**\n` +
				`\`<>\` means required • \`[]\` means optional\n\n` +
				`*Pick a category below to explore my commands!* 🌸`
			)
			.footer({ 
				text: `💖 Made with love • ${client.guilds.cache.size} Servers`,
				iconURL: ctx.author.displayAvatarURL()
			})
			.setTimestamp();

		const categoryEmojis = {
			music: '🎵',
			information: '📊',
			premium: '👑',
		};

		const menu = new StringSelectMenuBuilder()
			.setCustomId('menu')
			.setPlaceholder('🌸 Select a category to explore~')
			.setMaxValues(1)
			.addOptions([
				{
					label: 'Home',
					value: 'home',
					description: 'Return to the cozy main menu!',
					emoji: '🏠',
				},
				...categories.map(category => ({
					label: `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
					value: category,
					description: `Explore ${allCommands[category]?.length || 0} ${category} commands!`,
					emoji: categoryEmojis[category] || '✨',
				})),
				{
					label: 'All Commands',
					value: 'all',
					description: 'View everything I can do!',
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
					const allEmbed = client.embed('#FF69B4')
						.setAuthor({ 
							name: `📜 ${client.user.username} - All Commands`,
							iconURL: client.user.displayAvatarURL()
						})
						.setThumbnail(client.user.displayAvatarURL())
						.desc(
							`Here's everything I can do for you! 💕\n\n` +
							Object.entries(allCommands)
								.sort((a, b) => a[0].localeCompare(b[0]))
								.map(([cat, cmds]) =>
									`**${categoryEmojis[cat] || '✨'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}** (\`${cmds.length} commands\`)\n` +
									`> ${cmds.map(cmd => `\`${cmd.name}\``).join(' • ')}`
								).join('\n\n') +
							`\n\n*Use \`${client.prefix}<command> -guide\` for detailed help!* 🌟`
						)
						.footer({ 
							text: `💖 Total: ${totalCommands} commands at your service!`,
							iconURL: ctx.author.displayAvatarURL()
						})
						.setTimestamp();
					await reply.edit({ embeds: [allEmbed] });
					break;

				default:
					const selectedCommands = allCommands[selected] || [];
					const categoryEmoji = categoryEmojis[selected] || '✨';
					const categoryEmbed = client.embed('#FF69B4')
						.setAuthor({ 
							name: `${categoryEmoji} ${client.user.username} - ${selected.charAt(0).toUpperCase() + selected.slice(1)}`,
							iconURL: client.user.displayAvatarURL()
						})
						.setThumbnail(client.user.displayAvatarURL())
						.desc(
							selectedCommands.length
								? `Here are all my **${selected}** commands! 🌸\n\n` +
								  `I have **${selectedCommands.length} commands** in this category ready to help you~\n\n` +
								  selectedCommands.map(cmd =>
									`**\`${client.prefix}${cmd.name}\`**\n└ ${cmd.description}`
								  ).join('\n\n') +
								  `\n\n*Tip: Use \`${client.prefix}<command> -guide\` for more details!* 💕`
								: `Oops! No commands here yet... 🥺`
						)
						.footer({ 
							text: `💖 ${selected.charAt(0).toUpperCase() + selected.slice(1)} • ${selectedCommands.length} commands`,
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
