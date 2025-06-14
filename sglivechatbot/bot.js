// Load environment variables from .env file for local development
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios'); // Using axios for HTTP requests

// Environment variables - these should be set in your hosting environment for production
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const STAFF_CHANNEL_ID = process.env.STAFF_CHANNEL_ID; // ID of your #contact-live channel
// The actual URL for the Netlify function, e.g., https://stainedglass.tn/.netlify/functions/discord-bot-relay
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_RELAY_FUNCTION_URL;

const REPLY_COMMAND_PREFIX = '!reply';

if (!BOT_TOKEN) {
    console.error('CRITICAL: DISCORD_BOT_TOKEN is not set.');
    process.exit(1);
}
if (!STAFF_CHANNEL_ID) {
    console.error('CRITICAL: STAFF_CHANNEL_ID (for #contact-live) is not set.');
    process.exit(1);
}
if (!NETLIFY_FUNCTION_URL) {
    console.error('CRITICAL: NETLIFY_RELAY_FUNCTION_URL (e.g., https://stainedglass.tn/.netlify/functions/discord-bot-relay) is not set.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Required to read message content
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is ready and listening for commands in channel ID: ${STAFF_CHANNEL_ID}.`);
    console.log(`Will relay replies to Netlify function: ${NETLIFY_FUNCTION_URL}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== STAFF_CHANNEL_ID) return;

    if (message.content.startsWith(REPLY_COMMAND_PREFIX)) {
        console.log(`[${new Date().toISOString()}] Received command: ${message.content} from ${message.author.tag} in #${message.channel.name}`);

        const args = message.content.slice(REPLY_COMMAND_PREFIX.length).trim().split(/ +/);

        if (args.length < 2) {
            const replyContent = `Invalid command format. Please use: ${REPLY_COMMAND_PREFIX} <userId> <your message>`;
            message.reply(replyContent).catch(console.error);
            console.log(`Invalid command format: "${message.content}". Not enough arguments.`);
            return;
        }

        const userId = args.shift();
        const replyMessageText = args.join(' ');
        const staffMemberName = message.author.username;

        console.log(`Attempting to relay reply for userId: "${userId}", from staff: "${staffMemberName}", message: "${replyMessageText}"`);

        try {
            const response = await axios.post(NETLIFY_FUNCTION_URL, {
                userId: userId,
                message: replyMessageText,
                senderName: staffMemberName
            });

            if (response.status === 200) {
                message.react('✅').catch(console.error);
                console.log(`Successfully relayed message for userId "${userId}". Netlify function responded with status 200.`);
            } else {
                message.react('⚠️').catch(console.error);
                console.error(`Netlify function responded with status ${response.status}: ${JSON.stringify(response.data)}`);
                message.reply(`There was an issue sending the reply (Netlify function status: ${response.status}). Check bot logs.`).catch(console.error);
            }
        } catch (error) {
            console.error('Error sending POST request to Netlify function:', error.message);
            let errorDetails = '';
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', JSON.stringify(error.response.data));
                errorDetails = ` (Status: ${error.response.status})`;
            } else if (error.request) {
                console.error('Error request data:', error.request);
                errorDetails = ' (No response received from server)';
            } else {
                console.error('Error message:', error.message);
            }
            message.react('❌').catch(console.error);
            message.reply(`Failed to send reply. Error contacting the relay service${errorDetails}. Check bot logs.`).catch(console.error);
        }
    }
});

client.on('error', error => {
    console.error('Discord client encountered an error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

console.log('Attempting to log in to Discord with bot token...');
client.login(BOT_TOKEN)
    .then(() => {
        console.log('Login command initiated successfully. Waiting for "ready" event...');
    })
    .catch(error => {
        console.error('CRITICAL: Failed to log in to Discord:', error.message);
        process.exit(1);
    });
