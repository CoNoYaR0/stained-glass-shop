require("dotenv").config();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Méthode non autorisée" })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { cart, customer, paiement, totalTTC } = data;

    const domain = process.env.DOMAIN || "https://stainedglass.tn";
    const note = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 🔐 Sauvegarde Supabase côté back
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase.from("pending_orders").insert([
      { note, data }
    ]);

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur enregistrement commande" })
      };
    }

    const payload = {
      vendor: process.env.PAYMEE_VENDOR,
      amount: totalTTC,
      note,
      webhook_url: `${domain}/.netlify/functions/webhook`,
      success_url: `${domain}/merci`,
      fail_url: `${domain}/merci`,
      mode: process.env.PAYMEE_MODE || "DYNAMIC"
    };

    const response = await axios.post(
      "https://app.paymee.tn/api/v1/payments/create",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${process.env.PAYMEE_TOKEN}`
        }
      }
    );

    const { payment_url } = response.data.data;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: payment_url })
    };
  } catch (err) {
    console.error("💥 Erreur create-payment:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" })
    };
  }
};
