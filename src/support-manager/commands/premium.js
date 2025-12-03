/**
 * Premium Command - Support Server Manager
 * Manage premium subscriptions for users
 */

export default {
    name: 'premium',
    aliases: ['prem'],
    description: 'Manage premium users',
    ownerOnly: true,
    cooldown: 3,

    async execute(client, message, args) {
        const action = args[0]?.toLowerCase();

        if (!action || !['add', 'remove', 'list', 'check'].includes(action)) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.info)
                        .setAuthor({
                            name: '👑 Premium Management',
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `Manage premium subscriptions! 💖\n\n` +
                            `**Commands:**\n` +
                            `\`${client.prefix}premium add <user> <days>\` - Grant premium\n` +
                            `\`${client.prefix}premium remove <user>\` - Remove premium\n` +
                            `\`${client.prefix}premium check <user>\` - Check status\n` +
                            `\`${client.prefix}premium list\` - View all premium users\n\n` +
                            `*Premium unlocks exclusive features and perks!* ✨`
                        )
                        .setFooter({ text: '💖 NeroX Support Manager' })
                ]
            });
        }

        switch (action) {
            case 'add':
                await addPremium(client, message, args.slice(1));
                break;
            case 'remove':
                await removePremium(client, message, args.slice(1));
                break;
            case 'check':
                await checkPremium(client, message, args.slice(1));
                break;
            case 'list':
                await listPremium(client, message);
                break;
        }
    }
};

async function addPremium(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Please mention a user or provide a valid ID! 🔍`)
            ]
        });
    }

    const days = parseInt(args[1]) || 30;
    if (days < 1 || days > 365) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} Duration must be between 1 and 365 days! 📅`)
            ]
        });
    }

    const current = await client.db.botstaff.get(target.id);
    if (current && current.expiresAt > Date.now()) {
        // Extend existing premium
        const newExpiry = current.expiresAt + (days * 86400000);
        await client.db.botstaff.set(target.id, {
            ...current,
            expiresAt: newExpiry,
        });

        const totalDays = Math.ceil((newExpiry - Date.now()) / 86400000);
        return message.reply({
            embeds: [
                client.embed(client.colors.success)
                    .setDescription(
                        `${client.emoji.check} Extended **${target.tag}**'s premium by **${days} days**! 👑\n\n` +
                        `New expiry: <t:${Math.floor(newExpiry / 1000)}:R>\n` +
                        `Total: **${totalDays} days** remaining! ✨`
                    )
            ]
        });
    }

    const expiresAt = Date.now() + (days * 86400000);
    await client.db.botstaff.set(target.id, {
        expiresAt: expiresAt,
        redeemedAt: Date.now(),
        addedBy: message.author.id,
    });

    const embed = client.embed(client.colors.success)
        .setAuthor({
            name: '👑 Premium Granted!',
            iconURL: client.user.displayAvatarURL()
        })
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
            `Congratulations! 🎉\n\n` +
            `**${target.tag}** has been granted **Premium** access!\n\n` +
            `**Duration:** ${days} days\n` +
            `**Expires:** <t:${Math.floor(expiresAt / 1000)}:R>\n\n` +
            `They now have access to all premium features~ 💫`
        )
        .setFooter({ 
            text: `💖 Granted by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Try to DM the user
    try {
        await target.send({
            embeds: [
                client.embed(client.colors.success)
                    .setAuthor({
                        name: '🎉 You got Premium!',
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setDescription(
                        `Hey there! Amazing news! 💖\n\n` +
                        `You've been granted **Premium** access on **NeroX**!\n\n` +
                        `**Duration:** ${days} days\n` +
                        `**Expires:** <t:${Math.floor(expiresAt / 1000)}:R>\n\n` +
                        `Enjoy all the exclusive premium features! 👑✨`
                    )
                    .setFooter({ text: '💖 NeroX Studios' })
            ]
        });
    } catch (error) {
        // User has DMs disabled
    }
}

async function removePremium(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Please mention a user or provide a valid ID! 🔍`)
            ]
        });
    }

    const hasPremium = await client.db.botstaff.get(target.id);
    if (!hasPremium) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`${client.emoji.warn} **${target.tag}** doesn't have premium! 🤔`)
            ]
        });
    }

    await client.db.botstaff.delete(target.id);

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(`${client.emoji.check} Removed premium from **${target.tag}**! 🗑️`)
        ]
    });
}

async function checkPremium(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription(`${client.emoji.cross} Please mention a user or provide a valid ID! 🔍`)
            ]
        });
    }

    const premium = await client.db.botstaff.get(target.id);
    const isActive = premium && premium.expiresAt > Date.now();

    const embed = client.embed(isActive ? client.colors.success : client.colors.info)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
            `**Premium Status** 👑\n\n` +
            `User: **${target.tag}**\n` +
            `Status: ${isActive ? '✅ Premium Active!' : '❌ No Premium'}\n` +
            (isActive ? 
                `\nExpires: <t:${Math.floor(premium.expiresAt / 1000)}:R>\n` +
                `Days left: **${Math.ceil((premium.expiresAt - Date.now()) / 86400000)}**\n\n` +
                `They have access to all premium features~ 💫` :
                `\nThey can get premium through giveaways or direct grant!`)
        );

    await message.reply({ embeds: [embed] });
}

async function listPremium(client, message) {
    const keys = await client.db.botstaff.keys;

    if (keys.length === 0) {
        return message.reply({
            embeds: [
                client.embed(client.colors.info)
                    .setDescription(`${client.emoji.info} No users have premium access yet! 🌟`)
            ]
        });
    }

    const users = [];
    for (const id of keys) {
        const data = await client.db.botstaff.get(id);
        const user = await client.users.fetch(id).catch(() => null);
        if (user && data) {
            const daysLeft = Math.ceil((data.expiresAt - Date.now()) / 86400000);
            const status = daysLeft > 0 ? `${daysLeft}d left` : 'Expired';
            users.push(`👑 **${user.tag}** - ${status}`);
        }
    }

    const embed = client.embed(client.colors.primary)
        .setAuthor({
            name: '👑 Premium Users',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            `Here are all premium users! 💖\n\n` +
            users.join('\n') +
            `\n\n*Total: ${users.length} user(s)* ✨`
        )
        .setFooter({ text: '💖 NeroX Support Manager' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
