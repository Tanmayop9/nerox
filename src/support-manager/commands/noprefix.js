/**
 * NoPrefix Command - Support Server Manager
 * Manage no-prefix access for users
 */

export default {
    name: 'noprefix',
    aliases: ['nop'],
    description: 'Manage no-prefix users',
    ownerOnly: true,
    cooldown: 3,

    async execute(client, message, args) {
        const action = args[0]?.toLowerCase();

        if (!action || !['add', 'remove', 'list', 'check'].includes(action)) {
            return message.reply({
                embeds: [
                    client.embed(client.colors.info)
                        .setAuthor({
                            name: 'No Prefix Management',
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `Manage no-prefix access for users.\n\n` +
                            `**Commands:**\n` +
                            `\`${client.prefix}noprefix add <user>\` - Grant no-prefix\n` +
                            `\`${client.prefix}noprefix remove <user>\` - Remove no-prefix\n` +
                            `\`${client.prefix}noprefix check <user>\` - Check status\n` +
                            `\`${client.prefix}noprefix list\` - View all users`
                        )
                        .setFooter({ text: 'NeroX Support Manager' })
                ]
            });
        }

        switch (action) {
            case 'add':
                await addNoPrefix(client, message, args.slice(1));
                break;
            case 'remove':
                await removeNoPrefix(client, message, args.slice(1));
                break;
            case 'check':
                await checkNoPrefix(client, message, args.slice(1));
                break;
            case 'list':
                await listNoPrefix(client, message);
                break;
        }
    }
};

async function addNoPrefix(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription('Please mention a user or provide a valid ID.')
            ]
        });
    }

    const hasNoPrefix = await client.db.noPrefix.get(target.id);
    if (hasNoPrefix) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`**${target.tag}** already has no-prefix.`)
            ]
        });
    }

    await client.db.noPrefix.set(target.id, true);

    const embed = client.embed(client.colors.success)
        .setAuthor({
            name: 'No Prefix Granted',
            iconURL: client.user.displayAvatarURL()
        })
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
            `**${target.tag}** has been granted No Prefix access.\n\n` +
            `They can now use commands without typing the prefix.`
        )
        .setFooter({ 
            text: `Granted by ${message.author.tag}`,
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
                        name: 'You got No Prefix!',
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setDescription(
                        `You've been granted **No Prefix** access on **NeroX**.\n\n` +
                        `You can now use commands without typing the prefix.`
                    )
                    .setFooter({ text: 'NeroX Studios' })
            ]
        });
    } catch (error) {
        // User has DMs disabled
    }
}

async function removeNoPrefix(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription('Please mention a user or provide a valid ID.')
            ]
        });
    }

    const hasNoPrefix = await client.db.noPrefix.get(target.id);
    if (!hasNoPrefix) {
        return message.reply({
            embeds: [
                client.embed(client.colors.warning)
                    .setDescription(`**${target.tag}** doesn't have no-prefix.`)
            ]
        });
    }

    await client.db.noPrefix.delete(target.id);

    await message.reply({
        embeds: [
            client.embed(client.colors.success)
                .setDescription(`Removed no-prefix from **${target.tag}**.`)
        ]
    });
}

async function checkNoPrefix(client, message, args) {
    const target = message.mentions.users.first() || 
        await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
        return message.reply({
            embeds: [
                client.embed(client.colors.error)
                    .setDescription('Please mention a user or provide a valid ID.')
            ]
        });
    }

    const hasNoPrefix = await client.db.noPrefix.get(target.id);

    await message.reply({
        embeds: [
            client.embed(hasNoPrefix ? client.colors.success : client.colors.info)
                .setThumbnail(target.displayAvatarURL())
                .setDescription(
                    `**No Prefix Status**\n\n` +
                    `User: **${target.tag}**\n` +
                    `Status: ${hasNoPrefix ? 'Active' : 'Not Active'}\n\n` +
                    `${hasNoPrefix ? 'They can use commands without prefix.' : 'They need to use the prefix for commands.'}`
                )
        ]
    });
}

async function listNoPrefix(client, message) {
    const keys = await client.db.noPrefix.keys;

    if (keys.length === 0) {
        return message.reply({
            embeds: [
                client.embed(client.colors.info)
                    .setDescription('No users have no-prefix access yet.')
            ]
        });
    }

    const users = [];
    for (const id of keys) {
        const user = await client.users.fetch(id).catch(() => null);
        if (user) {
            users.push(`**${user.tag}** (\`${user.id}\`)`);
        }
    }

    const embed = client.embed(client.colors.primary)
        .setAuthor({
            name: 'No Prefix Users',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            users.join('\n') +
            `\n\n*Total: ${users.length} user(s)*`
        )
        .setFooter({ text: 'NeroX Support Manager' })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}
