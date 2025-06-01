require("dotenv").config();
const axios = require("axios");

async function handleCreateOrder(body) {
  console.info("🚀 handleCreateOrder lancé");
  console.info("📥 Body reçu :", body);

  const { customer, cart, totalTTC, paiement } = body;
  console.info("💳 Mode de paiement :", paiement);

  const dolibarrAPI = process.env.DOLIBARR_API;
  const dolibarrToken = process.env.DOLIBARR_TOKEN;
  const headers = {
    DOLAPIKEY: dolibarrToken,
    "Content-Type": "application/json"
  };

  // 🔍 Vérifier si le client existe
  const clientEmail = customer.email;
  let clientId = null;
  try {
    const res = await axios.get(`${dolibarrAPI}/thirdparties`, {
      headers,
      params: { sqlfilters: `(email:=:'${clientEmail}')` }
    });
    if (res.data && res.data.length > 0) {
      clientId = res.data[0].id;
    }
  } catch (err) {
    console.error("❌ Erreur Dolibarr client :", err.response?.data || err);
  }

  // ➕ Créer client si inexistant
  if (!clientId) {
    const newClient = {
      name: `${customer.nom} ${customer.prenom}`,
      email: customer.email,
      address: customer.adresse,
      zip: "0000",
      town: "Tunis",
      country_id: 1,
      client: 1,
      status: 1,
      phone: customer.tel
    };
    const res = await axios.post(`${dolibarrAPI}/thirdparties`, newClient, { headers });
    clientId = res.data;
  }

  // 📦 Créer facture
  const invoiceLines = [];

  for (const product of cart) {
    const res = await axios.get(`${dolibarrAPI}/products/${product.id}`, { headers });
    const prodData = res.data;

    invoiceLines.push({
      fk_product: product.id,
      qty: product.qty,
      subprice: product.price_ht,
      tva_tx: product.tva,
      description: prodData.label
    });
  }

  const invoice = {
    socid: clientId,
    lines: invoiceLines,
    note_public: `Commande via site - Paiement : ${paiement.toUpperCase()} - Client : ${customer.nom} ${customer.prenom}`
  };

  const invoiceRes = await axios.post(`${dolibarrAPI}/invoices`, invoice, { headers });
  const invoiceId = invoiceRes.data;

  // ✅ Valider la facture
  await axios.post(`${dolibarrAPI}/invoices/${invoiceId}/validate`, {}, { headers });

  // ❌ Pas de set_paid automatique
  if (paiement.toLowerCase() === "cb") {
    console.info("📌 Paiement CB → notification manuelle uniquement");
  }

  // 📣 Notification Discord enrichie
  const webhookUrl = paiement.toLowerCase() === "cb"
    ? "https://discord.com/api/webhooks/1378708363784753182/uuslOYq8kSHPdhSS60M_j3Y6LFWrfLOfICNGC_3eV1I9xG0t9eSN43OlY7AdDr_Jq1P6"
    : "https://discord.com/api/webhooks/1378711499035644066/3oGD57D7mDBt_MW2h6x18WJbcr_LKyX4xlCOgW2yQpkmWDk57DwesOAC8cZ17uFnWogt";

  const message = {
    content: `📦 Nouvelle commande **${paiement.toUpperCase()}**
👤 ${customer.prenom} ${customer.nom}
📧 ${customer.email}
📱 ${customer.tel}
💰 Montant : ${totalTTC} DT
🧾 Facture ID : ${invoiceId}`
  };

  await axios.post(webhookUrl, message);
  console.info("📣 Notification Discord envoyée");

  return { success: true, invoiceId };
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    const result = await handleCreateOrder(body);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("❌ Erreur création commande:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

module.exports = { handleCreateOrder };
