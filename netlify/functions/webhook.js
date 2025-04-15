// ✅ Webhook Paymee → création de commande Dolibarr
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API_BASE = process.env.URL || "https://stainedglass.tn"; // pour appel interne
const SECRET_KEY = process.env.ORDER_SECRET;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    console.log("📩 Webhook reçu de Paymee:", payload);

    // Vérification basique que le paiement est bien validé
    if (!payload.status || payload.status !== "success") {
      console.warn("❌ Paiement non confirmé, ignoré");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Ignored non-success status" })
      };
    }

    // Utilisation d'une note comme token pour retrouver la commande en cache
    const token = payload.note;
    const filePath = path.join("/tmp/pending-orders", `${token}.json`);

    if (!fs.existsSync(filePath)) {
      console.error("❌ Commande en cache introuvable pour token:", token);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Commande introuvable" })
      };
    }

    const data = JSON.parse(fs.readFileSync(filePath));

    console.log("🧾 Commande à rejouer:", data);

    const res = await axios.post(`${API_BASE}/.netlify/functions/create-order`, data, {
      headers: {
        "x-secret-key": SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Commande créée via webhook. Résultat:", res.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, from: "webhook", result: res.data })
    };
  } catch (err) {
    console.error("💥 Erreur traitement webhook:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur webhook" })
    };
  }
};