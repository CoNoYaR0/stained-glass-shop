const axios = require("axios");

const API_BASE = process.env.DOLIBARR_URL;
const TOKEN = process.env.DOLIBARR_TOKEN;
const headers = {
  DOLAPIKEY: TOKEN,
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { customer, cart, totalTTC } = data;

    if (!customer || !cart?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données manquantes (client ou cart)" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Étape 1 validée, données reçues", customer, cart }),
    };
  } catch (err) {
    console.error("❌ Erreur générale:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
