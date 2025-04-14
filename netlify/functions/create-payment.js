export async function handler(event) {
  const body = JSON.parse(event.body);

  // Déterminer l’environnement (LIVE ou SANDBOX)
  const IS_LIVE = process.env.PAYMEE_MODE === "live"; // à définir dans Netlify
  const DOMAIN = process.env.DOMAIN || "https://resplendent-centaur-abf462.netlify.app";
  const API_URL = IS_LIVE
    ? "https://app.paymee.tn/api/v2/payments/create"
    : "https://sandbox.paymee.tn/api/v2/payments/create";

  const payload = {
    vendor: process.env.PAYMEE_VENDOR,
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

  console.log("📦 Envoi à Paymee:", payload);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.PAYMEE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("✅ Réponse Paymee:", data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("❌ Erreur Paymee:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors de la création du paiement Paymee." })
    };
  }
}
