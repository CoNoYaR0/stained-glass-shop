const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  console.log("🔰 Étape 1 : validation requête");

  // Refuser toute méthode autre que POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée (POST attendu)" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Corps de requête invalide (JSON attendu)" })
    };
  }

  // Validation des champs requis
  const { customer, cart, totalTTC, paiement } = body;

  if (!customer || typeof customer !== "object") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Données client manquantes ou invalides" })
    };
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Panier vide ou invalide" })
    };
  }

  if (!totalTTC || isNaN(Number(totalTTC))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Montant total TTC manquant ou invalide" })
    };
  }

  if (!paiement || typeof paiement !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Méthode de paiement manquante ou invalide" })
    };
  }

  console.log("✅ Étape 1 validée : body conforme");

  // ⚠️ TEMPORAIRE : stop ici pour test uniquement l'étape 1
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: "Étape 1 OK" })
  };
};
