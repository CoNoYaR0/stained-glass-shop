const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { message, userId } = JSON.parse(event.body); // Assuming a userId might be useful later
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!discordWebhookUrl) {
    console.error('Discord webhook URL is not configured.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error: Webhook not configured.' }) };
  }

  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing message.' }) };
  }

  // Simple text message for now. Can be enhanced with embeds like the contact form.
  const payload = {
    content: `Live Chat Message (User ${userId || 'Anonymous'}): ${message}`,
    // Optionally, use embeds for richer formatting if desired
    // embeds: [
    //   {
    //     description: message,
    //     color: 7506394, // Hex color #7289da (Discord Blurple)
    //     author: {
    //       name: `User ${userId || 'Anonymous'}`,
    //     },
    //     timestamp: new Date().toISOString(),
    //   },
    // ],
  };

  try {
    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error sending to Discord: ${response.status} ${response.statusText}`, errorBody);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error sending message to Discord.', error: errorBody }) };
    }

    // For now, just acknowledge. Real-time response will be handled separately.
    return { statusCode: 200, body: JSON.stringify({ message: 'Message sent to Discord.' }) };
  } catch (error) {
    console.error('Error sending to Discord:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error sending message to Discord.', error: error.message }) };
  }
};
