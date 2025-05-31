const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const API_BASE = process.env.URL || "https://stainedglass.tn";
const SECRET_KEY = process.env.ORDER_SECRET;

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
    // 🧠 Décodage intelligent du payload
    const payload = event.headers["content-type"]?.includes("application/json")
      ? JSON.parse(event.body)
      : Object.fromEntries(new URLSearchParams(event.body));

    console.log("🛰️ Webhook reçu", payload);
    console.log("📌 Status :", payload.status);
    console.log("🧾 Note :", payload.note);

    const token = payload.note;

    if (!payload.status || payload.status !== "success") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Ignored non-success status" })
      };
    }

    // 🔍 Rechercher la commande dans Supabase
    const { data: record, error } = await supabase
      .from("pending_orders")
      .select("data")
      .eq("note", token)
      .single();

    if (error || !record) {
      console.error("❌ Commande introuvable :", token);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Commande introuvable dans Supabase" })
      };
    }

    const data = record.data;

    // ✅ Appel à la fonction de création de commande
    const res = await axios.post(`${API_BASE}/.netlify/functions/create-order`, data, {
      headers: {
        "x-secret-key": SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, from: "webhook", result: res.data })
    };
  } catch (err) {
    console.error("💥 Erreur Webhook :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur webhook" })
    };
  }
};
