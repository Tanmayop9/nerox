/**
 * Ready Event - Support Server Manager
 * Handles bot startup and giveaway scheduling
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

        // Resume active giveaways
        await resumeGiveaways(client);
    }
};

async function resumeGiveaways(client) {
    try {
        const giveawayKeys = await client.db.giveaways.keys;
        let resumed = 0;
        let ended = 0;

        for (const giveawayId of giveawayKeys) {
            try {
                const giveaway = await client.db.giveaways.get(giveawayId);
                
                if (!giveaway || giveaway.ended) continue;

                const timeLeft = giveaway.endsAt - Date.now();

                if (timeLeft <= 0) {
                    // Giveaway should have ended while bot was offline
                    await endGiveawayOnStartup(client, giveawayId, giveaway);
                    ended++;
                } else {
                    // Schedule the giveaway to end
                    scheduleEnd(client, giveawayId, timeLeft);
                    resumed++;
                }
            } catch (err) {
                console.error(`[Giveaway] Error processing ${giveawayId}:`, err);
            }
        }

        if (resumed > 0 || ended > 0) {
            console.log(`[Giveaway] Resumed ${resumed} active, ended ${ended} expired giveaways`);
        }
    } catch (error) {
        console.error('[Giveaway] Error resuming giveaways:', error);
    }
}

async function endGiveawayOnStartup(client, giveawayId, giveaway) {
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

        // Apply prizes
        const prizeInfo = getPrizeInfo(giveaway.prize);
        for (const winnerId of winners) {
            try {
                if (giveaway.prize === 'noprefix') {
                    await client.db.noPrefix.set(winnerId, true);
                } else if (giveaway.prize === 'premium') {
                    await client.db.botstaff.set(winnerId, {
                        expiresAt: Date.now() + 30 * 86400000,
                        redeemedAt: Date.now(),
                        addedBy: 'Giveaway',
                    });
                }
            } catch (err) {
                console.error(`[Giveaway] Failed to apply prize to ${winnerId}:`, err);
            }
        }

        // Update message
        const endedEmbed = client.embed('#2F3136')
            .setAuthor({
                name: '🎉 GIVEAWAY ENDED',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**${prizeInfo.emoji} Prize:** ${prizeInfo.name}\n` +
                `**👥 Entries:** ${participants.length}\n` +
                `**🏆 Winner${winners.length !== 1 ? 's' : ''}:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}\n\n` +
                `${winners.length > 0 ? '🎊 Congratulations!' : '😢 No winners this time...'}`
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

    } catch (error) {
        console.error(`[Giveaway] Error ending ${giveawayId} on startup:`, error);
        await client.db.giveaways.set(giveawayId, { ...giveaway, ended: true });
    }
}

function scheduleEnd(client, giveawayId, delay) {
    setTimeout(async () => {
        try {
            const giveaway = await client.db.giveaways.get(giveawayId);
            if (!giveaway || giveaway.ended) return;

            await endGiveawayOnStartup(client, giveawayId, giveaway);
        } catch (error) {
            console.error(`[Giveaway] Error in scheduled end for ${giveawayId}:`, error);
        }
    }, delay);
}

function getPrizeInfo(prize) {
    const prizes = {
        noprefix: { emoji: '⚡', name: 'No Prefix Access' },
        premium: { emoji: '👑', name: 'Premium (30 days)' },
    };
    return prizes[prize] || { emoji: '🎁', name: prize };
}
