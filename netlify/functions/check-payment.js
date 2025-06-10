const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const token = event.queryStringParameters?.token;
  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Token manquant." })
    };
  }

  try {
    // Cherche la commande par note dans la table des commandes validées (ex: invoices ou valid_orders)
    const { data, error } = await supabase
      .from("valid_orders")
      .select("note")
      .eq("note", token)
      .single();

    if (error || !data) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: false })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: true })
    };
  } catch (err) {
    console.error("💥 check-payment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" })
    };
  }
};
