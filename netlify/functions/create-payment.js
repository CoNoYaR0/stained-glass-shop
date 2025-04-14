// Netlify Function: create-payment.js (LIVE)

export async function handler(event) {
  console.log("📥 Requête LIVE reçue :", event);

  let body;
  try {
    body = JSON.parse(event.body);
    console.log("📤 Données client LIVE :", body);
  } catch (err) {
    console.error("❌ JSON invalide :", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Requête invalide" })
    };
  }

  const DOMAIN =
    process.env.DOMAIN ||
    event.headers.origin ||
    "https://stainedglass.tn";

  const payload = {
    vendor: 27983, // ✅ Compte LIVE
    amount: body.amount,
    currency: "TND",
    note: "Commande checkout",
    first_name: body.prenom,
    last_name: body.nom,
    email: body.email,
    phone: body.tel,
    return_url: `${DOMAIN}/merci`,
    cancel_url: `${DOMAIN}/checkout`,
    webhook_url: `${DOMAIN}/webhook`
  };

  console.log("📦 Données envoyées à Paymee LIVE :", payload);

  try {
    const response = await fetch("https://app.paymee.tn/api/v2/payments/create", {
      method: "POST",
      headers: {
        "Authorization": "Token " + process.env.PAYMEE_TOKEN, // ✅ LIVE Token
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("💬 Réponse Paymee LIVE :", data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("❌ Erreur Paymee LIVE :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Paymee LIVE." })
    };
  }
}
