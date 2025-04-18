// Netlify Function: proxy-create-order.js
const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  const secret = process.env.ORDER_SECRET_KEY;
  console.log("[PROXY] Relais vers create-order avec clé interne sécurisée...");

  try {
    const response = await fetch(`${process.env.URL}/.netlify/functions/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secret
      },
      body: event.body
    });

    const data = await response.text();
    return {
      statusCode: response.status,
      body: data
    };
  } catch (err) {
    console.error("[PROXY ERROR] Erreur proxy vers create-order:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur proxy vers create-order" })
    };
  }
};
