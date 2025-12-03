/**
 * Warn Command - Support Server Manager
 * Warn users in the support server
 */

import crypto from 'crypto';
import { PermissionFlagsBits } from 'discord.js';

export default {
    name: 'warn',
    aliases: ['w'],
    description: 'Warn a user',
    supportOnly: true,
    cooldown: 3,

    async execute(client, message, args) {
        // Check if user has permission using Discord permissions (more secure)
        const isOwner = client.owners.includes(message.author.id);
        const hasModPermission = message.member?.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            message.member?.permissions.has(PermissionFlagsBits.KickMembers) ||
            message.member?.permissions.has(PermissionFlagsBits.BanMembers) ||
            message.member?.permissions.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !hasModPermission) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} You need moderation permissions to use this! 🔒`)
                ]
            });
        }

        const target = message.mentions.members.first() || 
            await message.guild.members.fetch(args[0]).catch(() => null);

        if (!target) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} Please mention a user or provide a valid ID! 🔍`)
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.warning)
                        .setDescription(`${client.emoji.warn} You can't warn yourself! 😅`)
                ]
            });
        }

        if (target.user.bot) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.warning)
                        .setDescription(`${client.emoji.warn} You can't warn bots! 🤖`)
                ]
            });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        const warnId = crypto.randomBytes(3).toString('hex').toUpperCase();

        // Get existing warnings
        const warnings = await client.db.warnings.get(target.id) || [];
        
        warnings.push({
            id: warnId,
            moderator: message.author.id,
            reason: reason,
            timestamp: Date.now(),
        });

        await client.db.warnings.set(target.id, warnings);

        const embed = client.embed(client.colors.warning)
            .setAuthor({
                name: '⚠️ User Warned',
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(target.displayAvatarURL())
            .setDescription(
                `A warning has been issued! 📋\n\n` +
                `**User:** ${target.user.tag}\n` +
                `**Warn ID:** \`${warnId}\`\n` +
                `**Reason:** ${reason}\n` +
                `**Total Warnings:** ${warnings.length}\n\n` +
                `${warnings.length >= 3 ? '⚠️ This user has 3+ warnings! Consider further action.' : 'Warning logged successfully!'}`
            )
            .setFooter({ 
                text: `💖 Warned by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

        // Try to DM the user
        try {
            await target.send({
                embeds: [
                    client.embed(client.colors.warning)
                        .setAuthor({
                            name: '⚠️ You received a warning',
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `You have been warned in **${message.guild.name}**! 😔\n\n` +
                            `**Reason:** ${reason}\n` +
                            `**Total Warnings:** ${warnings.length}\n\n` +
                            `Please follow the server rules to avoid further action! 💕`
                        )
                        .setFooter({ text: '💖 NeroX Support Manager' })
                ]
            });
        } catch (error) {
            // User has DMs disabled
        }

        // Log the warning
        await client.db.logs.set(`warn_${warnId}`, {
            type: 'warn',
            target: target.id,
            moderator: message.author.id,
            reason: reason,
            guild: message.guild.id,
            timestamp: Date.now(),
        });
    }
};
