/**
 * Ready Event - Support Server Manager
 * Handles bot startup and giveaway management with periodic checks
 */

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`\n✨ ═══════════════════════════════════════════ ✨`);
        console.log(`   💖 ${client.user.tag} is now online!`);
        console.log(`   🏠 Support Guild: ${client.supportGuild || 'Not configured'}`);
        console.log(`   📊 Watching ${client.guilds.cache.size} server(s)`);
        console.log(`   🎀 Commands loaded: ${client.commands.size}`);
        console.log(`✨ ═══════════════════════════════════════════ ✨\n`);

        // Set bot status
        client.user.setPresence({
            activities: [
                {
                    name: '💖 NeroX Support',
                    type: 3, // Watching
                }
            ],
            status: 'online',
        });

        // Initialize giveaway timeout storage
        client.giveawayTimeouts = new Map();

        // Process any giveaways that expired while bot was offline
        await processExpiredGiveaways(client);

        // Start periodic giveaway check (every 30 seconds)
        // This is more reliable than long setTimeout calls
        setInterval(() => checkActiveGiveaways(client), 30000);
        
        console.log('[Giveaway] Periodic check system started (30s interval)');
    }
};

// Check for expired giveaways periodically
async function checkActiveGiveaways(client) {
    try {
        const giveawayKeys = await client.db.giveaways.keys;
        
        for (const giveawayId of giveawayKeys) {
            try {
                const giveaway = await client.db.giveaways.get(giveawayId);
                
                if (!giveaway || giveaway.ended) continue;
                
                // Check if giveaway has ended
                if (Date.now() >= giveaway.endsAt) {
                    await endGiveaway(client, giveawayId, giveaway);
                }
            } catch (err) {
                console.error(`[Giveaway] Error checking ${giveawayId}:`, err);
            }
        }
    } catch (error) {
        console.error('[Giveaway] Error in periodic check:', error);
    }
}

// Process expired giveaways on startup
async function processExpiredGiveaways(client) {
    try {
        const giveawayKeys = await client.db.giveaways.keys;
        let processed = 0;
        let active = 0;

        for (const giveawayId of giveawayKeys) {
            try {
                const giveaway = await client.db.giveaways.get(giveawayId);
                
                if (!giveaway || giveaway.ended) continue;

                if (Date.now() >= giveaway.endsAt) {
                    await endGiveaway(client, giveawayId, giveaway);
                    processed++;
                } else {
                    active++;
                }
            } catch (err) {
                console.error(`[Giveaway] Error processing ${giveawayId}:`, err);
            }
        }

        if (processed > 0 || active > 0) {
            console.log(`[Giveaway] Startup: ${processed} ended, ${active} active giveaways`);
        }
    } catch (error) {
        console.error('[Giveaway] Error processing expired giveaways:', error);
    }
}

// End a giveaway and select winners
async function endGiveaway(client, giveawayId, giveaway) {
    try {
        // Fetch channel
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) {
            await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
            console.log(`[Giveaway] ${giveawayId} ended - channel not found`);
            return;
        }

        // Fetch message
        const giveawayMsg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!giveawayMsg) {
            await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
            console.log(`[Giveaway] ${giveawayId} ended - message not found`);
            return;
        }

        // Get participants from reactions
        let participants = [];
        const reaction = giveawayMsg.reactions.cache.get('🎉');
        
        if (reaction) {
            try {
                const users = await reaction.users.fetch();
                participants = users.filter(u => !u.bot).map(u => u.id);
            } catch (err) {
                console.error(`[Giveaway] Error fetching reactions for ${giveawayId}:`, err);
            }
        }

        // Select random winners
        const winners = [];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(giveaway.winners, shuffled.length); i++) {
            winners.push(shuffled[i]);
        }

        // Update database FIRST to prevent re-processing
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

        // Update giveaway message
        const endedEmbed = client.embed('#2F3136')
            .setAuthor({
                name: '🎉 GIVEAWAY ENDED',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**${prizeInfo.emoji} Prize:** ${prizeInfo.name}\n` +
                `**👥 Entries:** ${participants.length}\n` +
                `**🏆 Winner${winners.length !== 1 ? 's' : ''}:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}\n\n` +
                `${winners.length > 0 ? '🎊 Congratulations! Prizes applied!' : '😢 No winners this time...'}`
            )
            .setFooter({ text: `ID: ${giveawayId} • Ended` })
            .setTimestamp();

        await giveawayMsg.edit({ embeds: [endedEmbed] }).catch(() => null);

        // Announce winners
        if (winners.length > 0) {
            await channel.send({
                content: `🎉 **Congratulations** ${winners.map(id => `<@${id}>`).join(', ')}!\n\nYou won **${prizeInfo.name}**! 💖`,
            }).catch(() => null);
        }

        console.log(`[Giveaway] ${giveawayId} ended - ${winners.length} winner(s) from ${participants.length} entries`);

    } catch (error) {
        console.error(`[Giveaway] Error ending ${giveawayId}:`, error);
        // Mark as ended to prevent infinite retries
        try {
            await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true, error: error.message });
        } catch (e) {
            // Ignore
        }
    }
}

function getPrizeInfo(prize) {
    const prizes = {
        noprefix: { emoji: '⚡', name: 'No Prefix Access' },
        premium: { emoji: '👑', name: 'Premium (30 days)' },
    };
    return prizes[prize] || { emoji: '🎁', name: prize };
}
