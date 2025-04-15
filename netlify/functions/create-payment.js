const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // pour générer un token unique

exports.handler = async function (event) {
  console.log("📥 Requête LIVE reçue :", event);

  const body = JSON.parse(event.body || "{}");

  const {
    prenom,
    nom,
    email,
    tel,
    amount,
    adresse,
    cart
  } = body;

  console.log("📤 Données client LIVE :", { prenom, nom, email, tel, amount });

  // Générer un token unique pour relier au webhook
  const token = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Enregistrer la commande localement
  const commande = {
    customer: { prenom, nom, email, tel, adresse },
    cart: cart || [],
    totalTTC: amount
  };

  const dirPath = path.resolve("./data/pending-orders");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `${token}.json`);
  fs.writeFileSync(filePath, JSON.stringify(commande, null, 2));

  const payload = {
    vendor: process.env.PAYMEE_VENDOR,
    amount: amount,
    currency: "TND",
    note: token, // lien webhook
    first_name: prenom,
    last_name: nom,
    email: email,
    phone: tel,
    return_url: "https://stainedglass.tn/merci",
    cancel_url: "https://stainedglass.tn/checkout",
    webhook_url: "https://stainedglass.tn/.netlify/functions/webhook"
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