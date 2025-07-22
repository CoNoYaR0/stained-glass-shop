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
    try {
      const res = await axios.get(`${dolibarrAPI}/products`, {
        headers,
        params: { sqlfilters: `(ref:=:'${product.id}')` }
      });

      if (res.data && res.data.length > 0) {
        const prodData = res.data[0];
        invoiceLines.push({
          fk_product: prodData.id,
          qty: product.qty,
          subprice: product.price_ht,
          tva_tx: product.tva,
          description: prodData.label
        });
      } else {
        throw new Error(`Product with ref ${product.id} not found in Dolibarr.`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du produit ${product.id}:`, error.response?.data || error.message);
      throw new Error(`Failed to retrieve product details for ${product.id}.`);
    }
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
  let webhookUrl;
  const paymentType = paiement.toLowerCase();
  let missingEnvVarName = null;

  if (paymentType === "cb") {
    webhookUrl = process.env.DISCORD_WEBHOOK_CB;
    if (!webhookUrl) missingEnvVarName = "DISCORD_WEBHOOK_CB";
  } else {
    webhookUrl = process.env.DISCORD_WEBHOOK_LIVRAISON;
    if (!webhookUrl) missingEnvVarName = "DISCORD_WEBHOOK_LIVRAISON";
  }

  if (!webhookUrl) {
    console.warn(`⚠️ URL du webhook Discord pour les paiements '${paymentType}' (${missingEnvVarName}) n'est pas configurée. Notification Discord ignorée.`);
  } else {
    const message = {
      content: `📦 Nouvelle commande **${paiement.toUpperCase()}**
👤 ${customer.prenom} ${customer.nom}
📧 ${customer.email}
📱 ${customer.tel}
💰 Montant : ${totalTTC} DT
🧾 Facture ID : ${invoiceId}`
    };

    try {
      await axios.post(webhookUrl, message);
      console.info("📣 Notification Discord envoyée avec succès.");
    } catch (discordError) {
      let errorMessage = `⚠️ Erreur (non critique) lors de l'envoi de la notification Discord: ${discordError.message}.`;
      if (discordError.response) {
        errorMessage += ` Réponse de Discord: ${JSON.stringify(discordError.response.data)}.`;
      }
      console.warn(errorMessage); // Use console.warn for non-critical operational warnings
    }
  }

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

// ✅ Export requis pour le webhook
exports.handleCreateOrder = handleCreateOrder;
