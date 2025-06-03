const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { name, email, message } = JSON.parse(event.body);
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!discordWebhookUrl) {
    console.error('Discord webhook URL is not configured.');
    return { statusCode: 500, body: 'Internal Server Error: Webhook not configured.' };
  }

  if (!name || !email || !message) {
    return { statusCode: 400, body: 'Bad Request: Missing name, email, or message.' };
  }

  const payload = {
    content: `New Contact Form Submission from: **${name}**`,
    embeds: [
      {
        title: 'Contact Message',
        description: message,
        color: 5814783, // Hex color #58acff
        fields: [
          {
            name: 'Sender Name',
            value: name,
            inline: true,
          },
          {
            name: 'Sender Email',
            value: email,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
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
      console.error(`Error sending to Discord: ${response.status} ${response.statusText}`, await response.text());
      return { statusCode: 500, body: 'Error sending message to Discord.' };
    }

    return { statusCode: 200, body: 'Message sent successfully to Discord!' };
  } catch (error) {
    console.error('Error sending to Discord:', error);
    return { statusCode: 500, body: 'Error sending message to Discord.' };
  }
};
