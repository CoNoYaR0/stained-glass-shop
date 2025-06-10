const { createClient } = require("@supabase/supabase-js");
const { handleCreateOrder } = require("./create-order");

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
    const payload = Object.fromEntries(new URLSearchParams(event.body));
    console.log("🛰️ Webhook reçu", payload);

    const note = payload.note;
    const payment_status = payload.payment_status;

    if (!note || payment_status !== "True") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ignored" })
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "not_found" })
      };
    }

    const data = record.data;

    await handleCreateOrder(data);
    console.log("✅ Commande traitée");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "success" })
    };

  } catch (err) {
    console.error("💥 Erreur Webhook :", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "server_error" })
    };
  }
};
