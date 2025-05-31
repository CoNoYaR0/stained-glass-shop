const axios = require("axios");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const API_BASE = process.env.URL || "https://stainedglass.tn";
const SECRET_KEY = process.env.ORDER_SECRET;
const PAYMEE_SECRET = process.env.PAYMEE_TOKEN; // <— utilise le même token

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    const payload = Object.fromEntries(new URLSearchParams(event.body));

    console.log("🛰️ Webhook reçu", payload);

    const token = payload.token;
    const note = payload.note;
    const payment_status = payload.payment_status;
    const receivedChecksum = payload.check_sum;

    console.log("🔒 Vérification checksum pour token:", token);

    const computedChecksum = crypto
      .createHash("md5")
      .update(token + payment_status + PAYMEE_SECRET)
      .digest("hex");

    if (computedChecksum !== receivedChecksum) {
      console.error("❌ Checksum invalide. Attendu:", computedChecksum, " Reçu:", receivedChecksum);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Checksum invalide" })
      };
    }

    if (payment_status !== "True") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Paiement non validé" })
      };
    }

    const { data: record, error } = await supabase
      .from("pending_orders")
      .select("data")
      .eq("note", note)
      .single();

    if (error || !record) {
      console.error("❌ Commande introuvable dans Supabase pour note:", note);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Commande introuvable dans Supabase" })
      };
    }

    const data = record.data;

    const res = await axios.post(`${API_BASE}/.netlify/functions/create-order`, data, {
      headers: {
        "x-secret-key": SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Commande créée avec succès :", res.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result: res.data })
    };

  } catch (err) {
    console.error("💥 Erreur Webhook :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur webhook" })
    };
  }
};
