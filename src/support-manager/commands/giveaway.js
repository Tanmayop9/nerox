/**
 * Giveaway Command - Support Server Manager
 * Create and manage giveaways for noprefix, premium, etc.
 * Error-free and production-ready
 */

import crypto from 'crypto';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default {
    name: 'giveaway',
    aliases: ['gw', 'gcreate'],
    description: 'Create and manage giveaways',
    ownerOnly: true,
    supportOnly: true,
    cooldown: 5,

    async execute(client, message, args) {
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand || !['create', 'end', 'reroll', 'list', 'delete', 'info'].includes(subcommand)) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.info)
                        .setAuthor({
                            name: '🎉 Giveaway System',
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `Welcome to the Giveaway System! 💖\n\n` +
                            `**📝 Available Commands:**\n` +
                            `\`${client.prefix}giveaway create <duration> <prize> <winners> [channel]\`\n` +
                            `\`${client.prefix}giveaway end <id>\` - End a giveaway early\n` +
                            `\`${client.prefix}giveaway reroll <id>\` - Pick new winners\n` +
                            `\`${client.prefix}giveaway list\` - View active giveaways\n` +
                            `\`${client.prefix}giveaway info <id>\` - View giveaway details\n` +
                            `\`${client.prefix}giveaway delete <id>\` - Delete a giveaway\n\n` +
                            `**🎁 Prize Types:**\n` +
                            `• \`noprefix\` - ⚡ No Prefix Access\n` +
                            `• \`premium\` - 👑 Premium Subscription (30 days)\n\n` +
                            `**⏱️ Duration Examples:**\n` +
                            `• \`10m\` - 10 minutes\n` +
                            `• \`1h\` - 1 hour\n` +
                            `• \`1d\` - 1 day\n` +
                            `• \`1w\` - 1 week\n\n` +
                            `**Example:**\n` +
                            `\`${client.prefix}giveaway create 1h noprefix 1\`\n\n` +
                            `*Let's make someone's day special!* ✨`
                        )
                        .setFooter({ text: '💖 NeroX Support Manager' })
                        .setTimestamp()
                ]
            });
        }

        try {
            switch (subcommand) {
                case 'create':
                    await createGiveaway(client, message, args.slice(1));
                    break;
                case 'end':
                    await endGiveawayCommand(client, message, args[1]);
                    break;
                case 'reroll':
                    await rerollGiveaway(client, message, args[1]);
                    break;
                case 'list':
                    await listGiveaways(client, message);
                    break;
                case 'info':
                    await giveawayInfo(client, message, args[1]);
                    break;
                case 'delete':
                    await deleteGiveaway(client, message, args[1]);
                    break;
            }
        } catch (error) {
            console.error('[Giveaway] Error:', error);
            return message.reply({
                embeds: [
                    client.embed(client.colors.error)
                        .setDescription(`${client.emoji.cross} An error occurred: ${error.message}`)
                ]
            });
        }
    }
};

// ==================== CREATE GIVEAWAY ====================
async function createGiveaway(client, message, args) {
    if (args.length < 3) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(
                        `${client.emoji.warn} Missing arguments! 📝\n\n` +
                        `**Usage:** \`${client.prefix}giveaway create <duration> <prize> <winners> [channel]\`\n\n` +
                        `**Example:** \`${client.prefix}giveaway create 1h noprefix 1\``
                    )
            ]
        });
    }

    const durationStr = args[0];
    const prize = args[1].toLowerCase();
    const winnersCount = parseInt(args[2]);
    const channel = message.mentions.channels.first() || message.channel;

    // Validate duration
    const duration = parseDuration(durationStr);
    if (!duration || duration < 60000) { // Minimum 1 minute
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Invalid duration! Minimum is 1 minute.\n\nUse: \`10m\`, \`1h\`, \`1d\`, \`1w\``)
            ]
        });
    }

    // Validate prize
    if (!['noprefix', 'premium'].includes(prize)) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Invalid prize type!\n\nValid types: \`noprefix\`, \`premium\``)
            ]
        });
    }

    // Validate winners count
    if (isNaN(winnersCount) || winnersCount < 1 || winnersCount > 10) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Winners must be between 1 and 10!`)
            ]
        });
    }

    // Generate unique ID
    const giveawayId = crypto.randomBytes(4).toString('hex').toUpperCase();
    const endsAt = Date.now() + duration;
    const prizeInfo = getPrizeInfo(prize);

    // Create giveaway embed
    const embed = client.embed(client.colors.primary)
        .setAuthor({
            name: '🎉 GIVEAWAY',
            iconURL: client.user.displayAvatarURL()
        })
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(
            `React with 🎉 to enter!\n\n` +
            `**${prizeInfo.emoji} Prize:** ${prizeInfo.name}\n` +
            `**🏆 Winners:** ${winnersCount}\n` +
            `**⏰ Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n` +
            `**👤 Host:** ${message.author}\n\n` +
            `*Good luck!* ✨`
        )
        .setFooter({ text: `ID: ${giveawayId} • React to enter!` })
        .setTimestamp(endsAt);

    // Send the giveaway message
    let giveawayMsg;
    try {
        giveawayMsg = await channel.send({ embeds: [embed] });
        await giveawayMsg.react('🎉');
    } catch (err) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Failed to send giveaway message! Check channel permissions.`)
            ]
        });
    }

    // Save to database
    await client.db.giveaways.set(giveawayId, {
        id: giveawayId,
        messageId: giveawayMsg.id,
        channelId: channel.id,
        guildId: message.guild.id,
        hostId: message.author.id,
        prize: prize,
        winners: winnersCount,
        endsAt: endsAt,
        ended: false,
        winnersIds: [],
        participants: [],
        createdAt: Date.now(),
    });

    // Schedule end
    scheduleGiveawayEnd(client, giveawayId, duration);

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(
                    `${client.emoji.check} Giveaway created! 🎉\n\n` +
                    `**ID:** \`${giveawayId}\`\n` +
                    `**Channel:** ${channel}\n` +
                    `**Ends:** <t:${Math.floor(endsAt / 1000)}:R>`
                )
        ]
    });
}

// ==================== END GIVEAWAY ====================
async function endGiveawayCommand(client, message, giveawayId) {
    if (!giveawayId) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} Please provide a giveaway ID!`)
            ]
        });
    }

    const giveaway = await client.db.giveaways.get(giveawayId.toUpperCase());
    if (!giveaway) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Giveaway \`${giveawayId}\` not found!`)
            ]
        });
    }

    if (giveaway.ended) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} This giveaway has already ended!`)
            ]
        });
    }

    await endGiveaway(client, giveawayId.toUpperCase());

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(`${client.emoji.check} Giveaway \`${giveawayId}\` has been ended!`)
        ]
    });
}

// ==================== END GIVEAWAY LOGIC ====================
async function endGiveaway(client, giveawayId) {
    const giveaway = await client.db.giveaways.get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    try {
        // Fetch channel and message
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) {
            await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
            return;
        }

        const giveawayMsg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!giveawayMsg) {
            await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
            return;
        }

        // Get participants from reactions
        const reaction = giveawayMsg.reactions.cache.get('🎉');
        let participants = [];

        if (reaction) {
            const users = await reaction.users.fetch();
            participants = users.filter(u => !u.bot).map(u => u.id);
        }

        // Select random winners
        const winners = [];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(giveaway.winners, shuffled.length); i++) {
            winners.push(shuffled[i]);
        }

        // Update database
        await client.db.giveaways.set(giveawayId, {
            ...giveaway,
            ended: true,
            winnersIds: winners,
            participants: participants,
            endedAt: Date.now(),
        });

        // Apply prizes to winners
        const prizeInfo = getPrizeInfo(giveaway.prize);
        for (const winnerId of winners) {
            try {
                if (giveaway.prize === 'noprefix') {
                    await client.db.noPrefix.set(winnerId, true);
                } else if (giveaway.prize === 'premium') {
                    await client.db.botstaff.set(winnerId, {
                        expiresAt: Date.now() + 30 * 86400000, // 30 days
                        redeemedAt: Date.now(),
                        addedBy: 'Giveaway',
                    });
                }
            } catch (err) {
                console.error(`[Giveaway] Failed to apply prize to ${winnerId}:`, err);
            }
        }

        // Create ended embed
        const endedEmbed = client.embed('#2F3136')
            .setAuthor({
                name: '🎉 GIVEAWAY ENDED',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**${prizeInfo.emoji} Prize:** ${prizeInfo.name}\n` +
                `**👥 Entries:** ${participants.length}\n` +
                `**🏆 Winner${winners.length !== 1 ? 's' : ''}:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}\n\n` +
                `${winners.length > 0 ? '🎊 Congratulations! Prizes have been applied!' : '😢 No winners this time...'}`
            )
            .setFooter({ text: `ID: ${giveawayId} • Ended` })
            .setTimestamp();

        await giveawayMsg.edit({ embeds: [endedEmbed] });

        // Announce winners
        if (winners.length > 0) {
            await channel.send({
                content: `🎉 **Congratulations** ${winners.map(id => `<@${id}>`).join(', ')}!\n\nYou won **${prizeInfo.name}**! Your prize has been applied~ 💖`,
            });
        }

    } catch (error) {
        console.error(`[Giveaway] Error ending giveaway ${giveawayId}:`, error);
        await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
    }
}

// ==================== REROLL GIVEAWAY ====================
async function rerollGiveaway(client, message, giveawayId) {
    if (!giveawayId) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} Please provide a giveaway ID!`)
            ]
        });
    }

    const giveaway = await client.db.giveaways.get(giveawayId.toUpperCase());
    if (!giveaway) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Giveaway \`${giveawayId}\` not found!`)
            ]
        });
    }

    if (!giveaway.ended) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} This giveaway hasn't ended yet!`)
            ]
        });
    }

    // Get eligible participants (not already winners)
    const eligible = giveaway.participants.filter(id => !giveaway.winnersIds.includes(id));

    if (eligible.length === 0) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} No eligible participants for reroll!`)
            ]
        });
    }

    // Pick new winner
    const newWinner = eligible[Math.floor(Math.random() * eligible.length)];
    const prizeInfo = getPrizeInfo(giveaway.prize);

    // Apply prize
    try {
        if (giveaway.prize === 'noprefix') {
            await client.db.noPrefix.set(newWinner, true);
        } else if (giveaway.prize === 'premium') {
            await client.db.botstaff.set(newWinner, {
                expiresAt: Date.now() + 30 * 86400000,
                redeemedAt: Date.now(),
                addedBy: 'Giveaway Reroll',
            });
        }
    } catch (err) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Failed to apply prize!`)
            ]
        });
    }

    // Update database
    await client.db.giveaways.set(giveawayId.toUpperCase(), {
        ...giveaway,
        winnersIds: [...giveaway.winnersIds, newWinner],
    });

    // Announce
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
        await channel.send({
            content: `🎉 **Reroll Winner!** <@${newWinner}>\n\nYou won **${prizeInfo.name}**! 💖`,
        });
    }

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(`${client.emoji.check} Rerolled! New winner: <@${newWinner}>`)
        ]
    });
}

// ==================== LIST GIVEAWAYS ====================
async function listGiveaways(client, message) {
    const keys = await client.db.giveaways.keys;
    const activeGiveaways = [];

    for (const key of keys) {
        const gw = await client.db.giveaways.get(key);
        if (gw && !gw.ended) {
            activeGiveaways.push(gw);
        }
    }

    if (activeGiveaways.length === 0) {
        return message.reply({
            embeds: [
                client.embed(client.colors.info)
                    .setDescription(`${client.emoji.info} No active giveaways!\n\nCreate one with \`${client.prefix}giveaway create\``)
            ]
        });
    }

    const embed = client.embed(client.colors.primary)
        .setAuthor({
            name: '🎉 Active Giveaways',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            activeGiveaways.map(gw => {
                const prizeInfo = getPrizeInfo(gw.prize);
                return `**${prizeInfo.emoji} ${gw.id}**\n` +
                    `Prize: ${prizeInfo.name}\n` +
                    `Winners: ${gw.winners} • Ends: <t:${Math.floor(gw.endsAt / 1000)}:R>`;
            }).join('\n\n')
        )
        .setFooter({ text: `💖 ${activeGiveaways.length} active giveaway(s)` })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

// ==================== GIVEAWAY INFO ====================
async function giveawayInfo(client, message, giveawayId) {
    if (!giveawayId) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} Please provide a giveaway ID!`)
            ]
        });
    }

    const giveaway = await client.db.giveaways.get(giveawayId.toUpperCase());
    if (!giveaway) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Giveaway \`${giveawayId}\` not found!`)
            ]
        });
    }

    const prizeInfo = getPrizeInfo(giveaway.prize);
    const host = await client.users.fetch(giveaway.hostId).catch(() => null);

    const embed = client.embed(client.colors.info)
        .setAuthor({
            name: `🎉 Giveaway Info: ${giveaway.id}`,
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            `**${prizeInfo.emoji} Prize:** ${prizeInfo.name}\n` +
            `**🏆 Winners:** ${giveaway.winners}\n` +
            `**👤 Host:** ${host?.tag || giveaway.hostId}\n` +
            `**📊 Status:** ${giveaway.ended ? '❌ Ended' : '✅ Active'}\n` +
            `**⏰ ${giveaway.ended ? 'Ended' : 'Ends'}:** <t:${Math.floor((giveaway.endedAt || giveaway.endsAt) / 1000)}:R>\n` +
            `**👥 Participants:** ${giveaway.participants?.length || 'Counting...'}\n` +
            (giveaway.ended && giveaway.winnersIds?.length > 0 
                ? `**🏆 Winners:** ${giveaway.winnersIds.map(id => `<@${id}>`).join(', ')}\n` 
                : '') +
            `\n**📍 Channel:** <#${giveaway.channelId}>\n` +
            `**📝 Message ID:** \`${giveaway.messageId}\``
        )
        .setFooter({ text: '💖 NeroX Support Manager' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

// ==================== DELETE GIVEAWAY ====================
async function deleteGiveaway(client, message, giveawayId) {
    if (!giveawayId) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} Please provide a giveaway ID!`)
            ]
        });
    }

    const giveaway = await client.db.giveaways.get(giveawayId.toUpperCase());
    if (!giveaway) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Giveaway \`${giveawayId}\` not found!`)
            ]
        });
    }

    // Try to delete the message
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const giveawayMsg = await channel.messages.fetch(giveaway.messageId);
        await giveawayMsg.delete();
    } catch (err) {
        // Message might already be deleted
    }

    await client.db.giveaways.delete(giveawayId.toUpperCase());

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(`${client.emoji.check} Giveaway \`${giveawayId}\` has been deleted!`)
        ]
    });
}

// ==================== HELPER FUNCTIONS ====================
function parseDuration(str) {
    if (!str || typeof str !== 'string') return null;
    
    const match = str.match(/^(\d+)(m|h|d|w)$/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    if (isNaN(value) || value <= 0) return null;

    const unit = match[2].toLowerCase();
    const multipliers = {
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
}

function getPrizeInfo(prize) {
    const prizes = {
        noprefix: { emoji: '⚡', name: 'No Prefix Access' },
        premium: { emoji: '👑', name: 'Premium (30 days)' },
    };
    return prizes[prize] || { emoji: '🎁', name: prize };
}

// Schedule giveaway end - uses setTimeout for short durations, 
// but relies on periodic checks in ready.js for long durations
function scheduleGiveawayEnd(client, giveawayId, delay) {
    // For durations over 1 hour, rely on the periodic check system
    // The ready event checks every minute for expired giveaways
    if (delay > 3600000) {
        console.log(`[Giveaway] ${giveawayId} scheduled for ${Math.round(delay / 60000)} minutes via periodic check`);
        return;
    }
    
    // For short durations, use setTimeout for immediate response
    const timeoutId = setTimeout(async () => {
        try {
            const giveaway = await client.db.giveaways.get(giveawayId);
            if (giveaway && !giveaway.ended) {
                await endGiveaway(client, giveawayId);
            }
        } catch (error) {
            console.error(`[Giveaway] Error in scheduled end for ${giveawayId}:`, error);
        }
    }, delay);
    
    // Store timeout reference for cleanup if needed
    if (!client.giveawayTimeouts) client.giveawayTimeouts = new Map();
    client.giveawayTimeouts.set(giveawayId, timeoutId);
}

// Export for use in ready event
export { endGiveaway, scheduleGiveawayEnd };
