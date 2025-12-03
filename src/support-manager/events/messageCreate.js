/**
 * Message Create Event - Support Server Manager
 */

import { Collection } from 'discord.js';

export default {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const prefix = client.prefix;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName) || 
            client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        // Check if command is owner only
        if (command.ownerOnly && !client.owners.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} This command is only for bot owners! 💔`)
                ]
            });
        }

        // Check if command is support guild only
        if (command.supportOnly && message.guild.id !== client.supportGuild) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} This command can only be used in the support server! 🏠`)
                ]
            });
        }

        // Cooldown handling
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply({
                    embeds: [
                        client.embed(client.colors.warning)
                            .setDescription(`${client.emoji.warn} Please wait **${timeLeft.toFixed(1)}s** before using this command again! ⏰`)
                    ]
                });
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // Execute command
        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`[Support Manager] Error executing ${command.name}:`, error);
            await message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} Oops! Something went wrong... 💔\n\`\`\`${error.message}\`\`\``)
                ]
            });
        }
    }
};
