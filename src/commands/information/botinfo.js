import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import os from 'os';
import moment from 'moment';
import { Command } from '../../classes/abstract/command.js';
import { filter } from '../../utils/filter.js';

export default class BotInfo extends Command {
	constructor() {
		super(...arguments);
		this.description = 'Peek behind the scenes of the bot’s core.';
	}

	async execute(client, ctx) {
		const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
		const uptime = moment.duration(client.uptime).humanize();
		const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
		const cpuModel = os.cpus()[0].model;
		const nodeVersion = process.version;
		const platform = os.platform();
		const architecture = os.arch();
		const ping = client.ws.ping;
		const totalGuilds = client.guilds.cache.size;
		const totalChannels = client.channels.cache.size;
		const commandsCount = client.commands.size;

		const embed = client.embed()
			.title(`${client.emoji.info} Bot Overview`)
			.desc(
				`${client.emoji.info} \`Uptime:\` ${uptime}\n` +
				`${client.emoji.info} \`Ping:\` ${ping}ms\n` +
				`${client.emoji.info} \`Servers:\` ${totalGuilds}\n` +
				`${client.emoji.info} \`Users:\` ${totalUsers}\n`
			)
			.footer({ text: 'NeroX Engine Operational' });

		const menu = new StringSelectMenuBuilder()
			.setCustomId('botinfo')
			.setPlaceholder('Pick a section to explore bot stats')
			.setMaxValues(1)
			.addOptions([
				{
					label: 'Overview',
					value: 'overview',
					emoji: client.emoji.info,
				},
				{
					label: 'System',
					value: 'system',
					emoji: client.emoji.info,
				},
				{
					label: 'Developer',
					value: 'developer',
					emoji: client.emoji.info,
				},
				{
					label: 'Stats',
					value: 'stats',
					emoji: client.emoji.info,
				},
			]);

		const msg = await ctx.reply({
			embeds: [embed],
			components: [new ActionRowBuilder().addComponents(menu)],
		});

		const collector = msg.createMessageComponentCollector({
			idle: 30000,
			filter: i => filter(i, ctx),
		});

		collector.on('collect', async interaction => {
			await interaction.deferUpdate();
			const choice = interaction.values[0];

			let updatedEmbed;

			if (choice === 'overview') {
				updatedEmbed = client.embed()
					.title(`${client.emoji.info} Bot Overview`)
					.desc(
						`${client.emoji.info} \`Prefix:\` ${client.prefix}\n` +
						`${client.emoji.info} \`Uptime:\` ${uptime}\n` +
						`${client.emoji.info} \`Ping:\` ${ping}ms\n` +
						`${client.emoji.info} \`Servers:\` ${totalGuilds}\n` +
						`${client.emoji.info} \`Channels:\` ${totalChannels}\n` +
						`${client.emoji.info} \`Users:\` ${totalUsers}\n`
					);
			} else if (choice === 'system') {
				updatedEmbed = client.embed()
					.title(`${client.emoji.info} System Blueprint`)
					.desc(
						`${client.emoji.info} \`CPU:\` ${cpuModel}\n` +
						`${client.emoji.info} \`Memory Usage:\` ${memoryUsage} MB\n` +
						`${client.emoji.info} \`Platform:\` ${platform}\n` +
						`${client.emoji.info} \`Architecture:\` ${architecture}\n` +
						`${client.emoji.info} \`Node.js:\` ${nodeVersion}\n`
					);
			} else if (choice === 'developer') {
				updatedEmbed = client.embed()
					.title(`${client.emoji.info} Crafted With Code`)
					.desc(
						`${client.emoji.info} \`Built By:\` NeroX Studios\n` +
						`${client.emoji.info} \`Version:\` v1.0.0\n` +
						`${client.emoji.info} \`Framework:\` Discord.js v14\n` +
						`${client.emoji.info} \`Database:\` MongoDB\n` +
						`${client.emoji.info} \`Support:\` [put your soft finger here](https://discord.gg/duM4dkbz9N)`
					);
			} else if (choice === 'stats') {
				updatedEmbed = client.embed()
					.title(`${client.emoji.info} Performance Metrics`)
					.desc(
						`${client.emoji.info} \`Commands Loaded:\` ${commandsCount}\n` +
						`${client.emoji.info} \`Shard:\` 0/${client.options.shardCount || '1'}\n` +
						`${client.emoji.info} \`Latency:\` ${ping}ms\n` +
						`${client.emoji.info} \`Cache Size:\` ${client.users.cache.size} users\n`
					);
			}

			await msg.edit({ embeds: [updatedEmbed] });
		});

		collector.on('end', async () => {
			await msg.edit({ components: [] }).catch(() => null);
		});
	}
}