/**
 * Interaction Create Event - Support Server Manager
 * Handles button interactions for giveaways
 */

export default {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        // Only handle button interactions
        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        // Handle giveaway entry button
        if (customId.startsWith('gw_enter_')) {
            await handleGiveawayEntry(client, interaction);
            return;
        }

        // Handle participants button
        if (customId.startsWith('gw_participants_')) {
            await handleParticipantsView(client, interaction);
            return;
        }
    }
};

async function handleGiveawayEntry(client, interaction) {
    const giveawayId = interaction.customId.replace('gw_enter_', '');
    
    try {
        const giveaway = await client.db.giveaways.get(giveawayId);
        
        if (!giveaway) {
            return interaction.reply({
                content: 'This giveaway no longer exists.',
                ephemeral: true
            });
        }

        if (giveaway.ended) {
            return interaction.reply({
                content: 'This giveaway has already ended.',
                ephemeral: true
            });
        }

        // Add reaction to the message for the user
        const message = interaction.message;
        const reaction = message.reactions.cache.get('🎉');
        
        if (reaction) {
            const users = await reaction.users.fetch();
            if (users.has(interaction.user.id)) {
                return interaction.reply({
                    content: 'You\'re already entered. Good luck!',
                    ephemeral: true
                });
            }
        }

        // React on behalf of the user (they need to react manually)
        return interaction.reply({
            content: 'React with 🎉 on the message to enter.',
            ephemeral: true
        });

    } catch (error) {
        console.error('[Giveaway] Entry error:', error);
        return interaction.reply({
            content: 'An error occurred. Please try reacting manually.',
            ephemeral: true
        });
    }
}

async function handleParticipantsView(client, interaction) {
    const giveawayId = interaction.customId.replace('gw_participants_', '');
    
    try {
        const giveaway = await client.db.giveaways.get(giveawayId);
        
        if (!giveaway) {
            return interaction.reply({
                content: 'This giveaway no longer exists.',
                ephemeral: true
            });
        }

        // Get current participants from reactions
        const message = interaction.message;
        const reaction = message.reactions.cache.get('🎉');
        let count = 0;

        if (reaction) {
            const users = await reaction.users.fetch();
            count = users.filter(u => !u.bot).size;
        }

        const prizeInfo = getPrizeInfo(giveaway.prize);
        const timeLeft = giveaway.endsAt - Date.now();
        const timeStr = timeLeft > 0 ? `<t:${Math.floor(giveaway.endsAt / 1000)}:R>` : 'Ended';

        const embed = client.embed(client.colors.info)
            .setAuthor({
                name: 'Giveaway Info',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `**Prize:** ${prizeInfo.name}\n` +
                `**Winners:** ${giveaway.winners}\n` +
                `**Participants:** ${count}\n` +
                `**Ends:** ${timeStr}\n\n` +
                `${giveaway.ended ? 'This giveaway has ended.' : 'React with 🎉 to enter.'}`
            )
            .setFooter({ text: `ID: ${giveawayId}` });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (error) {
        console.error('[Giveaway] Participants view error:', error);
        return interaction.reply({
            content: 'An error occurred.',
            ephemeral: true
        });
    }
}

function getPrizeInfo(prize) {
    const prizes = {
        noprefix: { emoji: '', name: 'No Prefix Access' },
        premium: { emoji: '', name: 'Premium (30 days)' },
    };
    return prizes[prize] || { emoji: '', name: prize };
}
