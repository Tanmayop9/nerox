/**
 * @nerox Support Server Manager
 * @author Tanmay
 * @copyright 2024 NeroX Studios
 * 
 * This is a support server manager bot that shares the database
 * with the main NeroX bot. It handles giveaways, moderation,
 * and server management for the NeroX support server.
 */

import { config as loadEnv } from 'dotenv';
import { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { josh } from '../functions/josh.js';
import { log } from '../logger.js';
import { readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));

class SupportManager extends Client {
    constructor() {
        super({
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.Message,
                Partials.Reaction,
                Partials.GuildMember,
            ],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
            ],
            allowedMentions: {
                repliedUser: false,
                parse: ['users', 'roles'],
            },
        });

        // Shared database with main bot
        this.db = {
            noPrefix: josh('noPrefix'),
            botstaff: josh('botstaff'),
            serverstaff: josh('serverstaff'),
            redeemCode: josh('redeemCode'),
            blacklist: josh('blacklist'),
            giveaways: josh('support/giveaways'),
            tickets: josh('support/tickets'),
            warnings: josh('support/warnings'),
            logs: josh('support/logs'),
        };

        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.prefix = process.env.SUPPORT_PREFIX || '!';
        this.supportGuild = process.env.SUPPORT_GUILD_ID;
        this.owners = process.env.OWNER_IDS?.split(',') || [];

        this.colors = {
            primary: '#FF69B4',
            success: '#00FF7F',
            error: '#FF6B6B',
            warning: '#FFD93D',
            info: '#6C63FF',
        };

        this.emoji = {
            check: '✅',
            cross: '❌',
            info: 'ℹ️',
            warn: '⚠️',
            giveaway: '🎉',
            premium: '👑',
            noprefix: '⚡',
            ticket: '🎫',
            star: '⭐',
            heart: '💖',
            sparkle: '✨',
        };
    }

    embed(color = this.colors.primary) {
        return new EmbedBuilder().setColor(color);
    }

    button() {
        return new ButtonBuilder();
    }

    async loadCommands() {
        const commandFiles = readdirSync(resolve(__dirname, './commands')).filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = (await import(`./commands/${file}`)).default;
            if (command.name) {
                this.commands.set(command.name, command);
                log(`[Support Manager] Loaded command: ${command.name}`, 'info');
            }
        }
    }

    async loadEvents() {
        const eventFiles = readdirSync(resolve(__dirname, './events')).filter(f => f.endsWith('.js'));
        
        for (const file of eventFiles) {
            const event = (await import(`./events/${file}`)).default;
            if (event.name) {
                if (event.once) {
                    this.once(event.name, (...args) => event.execute(this, ...args));
                } else {
                    this.on(event.name, (...args) => event.execute(this, ...args));
                }
                log(`[Support Manager] Loaded event: ${event.name}`, 'info');
            }
        }
    }

    async start() {
        await this.loadCommands();
        await this.loadEvents();
        
        await this.login(process.env.SUPPORT_BOT_TOKEN);
        log('[Support Manager] Bot started successfully!', 'info');
    }
}

// Export the client instance
const supportManager = new SupportManager();
export default supportManager;

// Start the bot if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    supportManager.start();
}
