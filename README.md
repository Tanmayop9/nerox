# Nerox Discord Bot

A Discord music bot with advanced features.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `example.env`:
```bash
cp example.env .env
```

3. Update the `.env` file with your Discord bot token and other credentials:
```
DISCORD_TOKEN=your_discord_bot_token_here
OWNER_IDS=your_discord_user_id
ADMIN_IDS=your_discord_user_id
PREFIX=&
SUPPORT_SERVER=https://discord.gg/your_server
BACKUP_CHANNEL=your_backup_channel_id
WEBHOOK_LOGS=your_logs_webhook_url
WEBHOOK_SERVERADD=your_serveradd_webhook_url
WEBHOOK_SERVERCHUDA=your_serverchuda_webhook_url
WEBHOOK_PLAYERLOGS=your_playerlogs_webhook_url
```

4. Start the bot:
```bash
npm start
```

## Configuration

The bot uses environment variables for configuration. All sensitive data like tokens and webhook URLs should be stored in the `.env` file and never committed to version control.

### Rate Limit Fix

The bot now uses a fixed shard count (1) instead of auto-detecting to avoid Discord API rate limiting (429 errors). This also reduces the number of clusters to 1 to minimize resource usage.

## Scripts

- `npm start` - Start the bot
- `npm run build` - Build TypeScript files
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

No license specified.
