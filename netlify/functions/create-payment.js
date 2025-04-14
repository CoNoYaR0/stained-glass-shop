const fetch = require("node-fetch");

exports.handler = async function (event) {
  console.log("📥 Requête LIVE reçue :", event);

  const body = JSON.parse(event.body || "{}");

  const {
    prenom,
    nom,
    email,
    tel,
    amount
  } = body;

  console.log("📤 Données client LIVE :", { prenom, nom, email, tel, amount });

  const payload = {
    vendor: process.env.PAYMEE_VENDOR,
    amount: amount,
    currency: "TND",
    note: "Commande checkout",
    first_name: prenom,
    last_name: nom,
    email: email,
    phone: tel,
    return_url: "https://stainedglass.tn/merci",
    cancel_url: "https://stainedglass.tn/checkout",
    webhook_url: "https://stainedglass.tn/webhook"
  };

  console.log("📦 Envoi à Paymee:", payload);

  try {
    const response = await fetch("https://app.paymee.tn/api/v2/payments/create", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.PAYMEE_TOKEN}`,
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
    console.error("❌ Erreur Paymee LIVE :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Paymee LIVE." })
    };
  }
};
