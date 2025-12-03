/**
 * Ready Event - Support Server Manager
 * Handles bot startup, giveaway management, and Lavalink stats
 */

import axios from 'axios';

// Lavalink configuration from environment
const LAVALINK_HOST = process.env.LAVALINK_HOST || '98.83.6.213';
const LAVALINK_PORT = process.env.LAVALINK_PORT || '25570';
const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || 'Atom1';
const LAVALINK_STATS_CHANNEL = process.env.LAVALINK_STATS_CHANNEL || '292929';

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`\n═══════════════════════════════════════════`);
        console.log(`   ${client.user.tag} is now online!`);
        console.log(`   Support Guild: ${client.supportGuild || 'Not configured'}`);
        console.log(`   Watching ${client.guilds.cache.size} server(s)`);
        console.log(`   Commands loaded: ${client.commands.size}`);
        console.log(`═══════════════════════════════════════════\n`);

        // Set bot status
        client.user.setPresence({
            activities: [
                {
                    name: 'NeroX Support',
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
        setInterval(() => checkActiveGiveaways(client), 30000);
        console.log('[Giveaway] Periodic check system started (30s interval)');

        // Send initial Lavalink stats (wait 5 seconds for Lavalink to be ready)
        setTimeout(() => sendLavalinkStats(client), 5000);

        // Update Lavalink stats every 1 hour (3600000 ms)
        setInterval(() => sendLavalinkStats(client), 3600000);
        console.log('[Lavalink] Stats update system started (1 hour interval)');
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

// Send Lavalink stats to channel and clear other messages
async function sendLavalinkStats(client) {
    try {
        const channel = await client.channels.fetch(LAVALINK_STATS_CHANNEL).catch(() => null);
        if (!channel) {
            console.log('[Lavalink] Stats channel not found');
            return;
        }

        // Fetch messages and delete all except Lavalink stats
        const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        if (messages) {
            const toDelete = messages.filter(msg => {
                // Keep only messages with Lavalink stats embed from this bot
                if (msg.author.id !== client.user.id) return true;
                const embed = msg.embeds[0];
                if (!embed) return true;
                return !embed.author?.name?.includes('Lavalink Stats');
            });
            
            // Bulk delete messages (only works for messages < 14 days old)
            if (toDelete.size > 0) {
                await channel.bulkDelete(toDelete, true).catch(() => {
                    // If bulk delete fails, delete individually
                    toDelete.forEach(msg => msg.delete().catch(() => {}));
                });
            }
        }

        // Fetch real Lavalink stats from REST API
        const lavalinkStats = await fetchLavalinkStats();
        
        // Create Lavalink stats embed
        const statsEmbed = createLavalinkEmbed(client, lavalinkStats);

        // Check if we already have a stats message to edit
        const existingStats = messages?.find(msg => {
            if (msg.author.id !== client.user.id) return false;
            const embed = msg.embeds[0];
            return embed?.author?.name?.includes('Lavalink Stats');
        });

        if (existingStats) {
            await existingStats.edit({ embeds: [statsEmbed] }).catch(() => {
                channel.send({ embeds: [statsEmbed] });
            });
        } else {
            await channel.send({ embeds: [statsEmbed] });
        }

        console.log('[Lavalink] Stats updated successfully');
    } catch (error) {
        console.error('[Lavalink] Error sending stats:', error);
    }
}

// Fetch Lavalink stats from REST API
async function fetchLavalinkStats() {
    try {
        const response = await axios.get(`http://${LAVALINK_HOST}:${LAVALINK_PORT}/v4/stats`, {
            headers: {
                'Authorization': LAVALINK_PASSWORD
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('[Lavalink] Failed to fetch stats:', error.message);
        return null;
    }
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format milliseconds to readable uptime
function formatMs(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Create Lavalink stats embed with real data
function createLavalinkEmbed(client, stats) {
    if (!stats) {
        // Fallback if Lavalink is offline
        return client.embed('#FF6B6B')
            .setAuthor({
                name: 'Lavalink Stats',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**Node:** ${LAVALINK_HOST}:${LAVALINK_PORT}\n` +
                `**Status:** Offline / Unreachable\n\n` +
                `Unable to fetch Lavalink statistics.\n` +
                `The node may be down or restarting.\n\n` +
                `*Last checked: <t:${Math.floor(Date.now() / 1000)}:R>*`
            )
            .setFooter({ text: 'Auto-updates every hour' })
            .setTimestamp();
    }

    const { players, playingPlayers, uptime, memory, cpu, frameStats } = stats;

    return client.embed(client.colors.primary)
        .setAuthor({
            name: 'Lavalink Stats',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            `**Node Info**\n` +
            `Host: \`${LAVALINK_HOST}:${LAVALINK_PORT}\`\n` +
            `Status: Online\n` +
            `Uptime: ${formatMs(uptime)}\n\n` +
            `**Players**\n` +
            `Total: ${players}\n` +
            `Playing: ${playingPlayers}\n\n` +
            `**Memory**\n` +
            `Used: ${formatBytes(memory.used)}\n` +
            `Free: ${formatBytes(memory.free)}\n` +
            `Allocated: ${formatBytes(memory.allocated)}\n` +
            `Reservable: ${formatBytes(memory.reservable)}\n\n` +
            `**CPU**\n` +
            `Cores: ${cpu.cores}\n` +
            `System Load: ${(cpu.systemLoad * 100).toFixed(2)}%\n` +
            `Lavalink Load: ${(cpu.lavalinkLoad * 100).toFixed(2)}%\n` +
            (frameStats ? `\n**Frame Stats**\n` +
            `Sent: ${frameStats.sent}\n` +
            `Nulled: ${frameStats.nulled}\n` +
            `Deficit: ${frameStats.deficit}\n` : '') +
            `\n*Last updated: <t:${Math.floor(Date.now() / 1000)}:R>*`
        )
        .setFooter({ text: 'Auto-updates every hour' })
        .setTimestamp();
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

        // Update giveaway message - minimalist design
        const endedEmbed = client.embed('#2F3136')
            .setAuthor({
                name: 'GIVEAWAY ENDED',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**Prize:** ${prizeInfo.name}\n` +
                `**Entries:** ${participants.length}\n` +
                `**Winner${winners.length !== 1 ? 's' : ''}:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}\n\n` +
                `${winners.length > 0 ? 'Congratulations! Prizes applied.' : 'No winners this time.'}`
            )
            .setFooter({ text: `ID: ${giveawayId} | Ended` })
            .setTimestamp();

        await giveawayMsg.edit({ embeds: [endedEmbed] }).catch(() => null);

        // Announce winners
        if (winners.length > 0) {
            await channel.send({
                content: `**Congratulations** ${winners.map(id => `<@${id}>`).join(', ')}! You won **${prizeInfo.name}**.`,
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
        noprefix: { emoji: '', name: 'No Prefix Access' },
        premium: { emoji: '', name: 'Premium (30 days)' },
    };
    return prizes[prize] || { emoji: '', name: prize };
}
