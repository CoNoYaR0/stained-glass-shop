// Netlify Function: create-payment.js (version avec logs étape par étape)

export async function handler(event) {
  console.log("📥 Requête reçue : ", event);

  let body;

  try {
    body = JSON.parse(event.body);
    console.log("📤 Données client reçues :", body);
  } catch (parseErr) {
    console.error("❌ Erreur de parsing JSON :", parseErr);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Requête invalide (JSON malformé)." })
    };
  }

  const DOMAIN =
    process.env.DOMAIN ||
    event.headers.origin ||
    "https://resplendent-centaur-abf462.netlify.app";

  const payload = {
    vendor: process.env.PAYMEE_VENDOR,
    amount: body.amount,
    note: "Commande checkout",
    first_name: body.prenom,
    last_name: body.nom,
    email: body.email,
    phone: body.tel,
    return_url: `${DOMAIN}/merci`,
    cancel_url: `${DOMAIN}/checkout`,
    webhook_url: `${DOMAIN}/webhook`
  };

  console.log("📦 Données envoyées à Paymee :", payload);

  try {
    const response = await fetch("https://sandbox.paymee.tn/api/v1/payments/create", {
      method: "POST",
      headers: {
        "Authorization": "Token " + process.env.PAYMEE_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("💬 Réponse complète de Paymee :", data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("❌ Erreur réseau ou Paymee :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur technique avec Paymee." })
    };
  }
}
