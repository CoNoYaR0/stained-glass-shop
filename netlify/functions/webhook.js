
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log("📦 Webhook reçu :", body);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook reçu avec succès" }),
    };
  } catch (err) {
    console.error("❌ Erreur webhook:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON payload" }),
    };
  }
}
