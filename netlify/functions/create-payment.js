const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { nom, prenom, email, tel, adresse, amount, cart } = body;

    const PAYMEE_TOKEN = process.env.PAYMEE_TOKEN;
    const PAYMEE_VENDOR = process.env.PAYMEE_VENDOR;
    const note = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      vendor: PAYMEE_VENDOR,
      amount: amount,
      note: note,
      first_name: nom,
      last_name: prenom,
      phone_number: tel,
      email: email,
      webhook_url: "https://stainedglass.tn/.netlify/functions/webhook",
      success_url: "https://stainedglass.tn/merci",
      fail_url: "https://stainedglass.tn/merci"
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Token ${PAYMEE_TOKEN}`
    };

    const response = await axios.post(
      "https://app.paymee.tn/api/v2/payments/create",
      payload,
      { headers }
    );

    // Sauvegarde dans Supabase
    const { error } = await supabase.from("pending_orders").insert({
      note: note,
      data: {
        customer: { nom, prenom, email, tel, adresse },
        cart: cart.map(p => ({
          id: p.id,
          qty: p.quantity,
          price_ht: p.price,
          tva: 20
        })),
        totalTTC: amount,
        paiement: "cb"
      }
    });

    if (error) {
      console.error("❌ Erreur insertion Supabase :", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur enregistrement commande dans Supabase" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          payment_url: response.data?.data?.payment_url,
          note: note
        }
      })
    };
  } catch (error) {
    console.error("💥 Erreur Paymee :", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur lors de la création du paiement",
        details: error.response?.data || error.message
      })
    };
  }
};
