# SGLiveChatBot

Discord bot to relay messages from a staff channel to the SGLiveChat widget via a Netlify function.

## Local Development Setup

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the root of the project with the following variables:
    ```env
    DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
    STAFF_CHANNEL_ID=YOUR_DISCORD_STAFF_CHANNEL_ID_HERE
    NETLIFY_RELAY_FUNCTION_URL=YOUR_NETLIFY_FUNCTION_ENDPOINT_URL_HERE
    # e.g., https://your-site.netlify.app/.netlify/functions/discord-bot-relay
    ```
    Replace the placeholder values with your actual credentials and URLs.
4.  **Run the bot:**
    *   For development with auto-restart: `npm run dev`
    *   To start normally: `npm start`

## Deployment (e.g., to Render.com)

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  On Render.com, create a new "Background Worker".
3.  Connect your Git repository.
4.  **Build Command:** `npm install`
5.  **Start Command:** `npm start`
6.  **Environment Variables:** Set the following environment variables in the Render service settings:
    *   `DISCORD_BOT_TOKEN`: Your bot's secret token.
    *   `STAFF_CHANNEL_ID`: The ID of the Discord channel where staff will type `!reply` commands.
    *   `NETLIFY_RELAY_FUNCTION_URL`: The full URL to your deployed Netlify relay function (e.g., `https://your-netlify-site.netlify.app/.netlify/functions/discord-bot-relay`).

## Command to Use in Discord

In your designated staff channel, use the following command to send a reply to a user on the website:

`!reply <userId> <your message here>`

*   `<userId>`: The unique ID of the user from the website chat.
*   `<your message here>`: The message you want to send to the user.
