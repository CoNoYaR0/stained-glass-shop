// Netlify Function: proxy-create-order.js
const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  // Clé côté serveur
  const secret = process.env.ORDER_SECRET_KEY;

  try {
    const response = await fetch(`${process.env.URL}/.netlify/functions/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Clé transmise uniquement à l'interne
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
    console.error("Erreur proxy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur proxy vers create-order" })
    };
  }
};
