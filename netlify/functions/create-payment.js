
const axios = require("axios");

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

    console.info("🎯 Création de paiement Paymee pour:", nom, prenom);

    const PAYMEE_TOKEN = process.env.PAYMEE_TOKEN;
    const PAYMEE_VENDOR = process.env.PAYMEE_VENDOR;

    const note = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const return_url = "https://stainedglass.tn/merci-cb";

    const payload = {
      vendor: PAYMEE_VENDOR,
      amount: amount,
      note: note,
      first_name: nom,
      last_name: prenom,
      phone_number: tel,
      email: email,
      success_url: return_url,
      fail_url: return_url
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${PAYMEE_TOKEN}`
    };

    const response = await axios.post("https://app.paymee.tn/api/v2/payments/create", payload, { headers });

    console.info("✅ Lien Paymee généré :", response.data?.data?.payment_url);

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
