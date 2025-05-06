require("dotenv").config();
const axios = require("axios");

exports.handler = async function (event) {
  console.info("🚀 create-order lancé");

  try {
    const body = JSON.parse(event.body);
    console.info("📥 Body reçu et parsé :", body);

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
    console.info("🔍 Vérification client existant via email :", clientEmail);

    let clientId = null;
    try {
      const res = await axios.get(`${dolibarrAPI}/thirdparties`, {
        headers,
        params: { sqlfilters: `(email:=:'${clientEmail}')` }
      });
      if (res.data && res.data.length > 0) {
        clientId = res.data[0].id;
        console.info("✅ Client existant trouvé :", clientId);
      }
    } catch (err) {
      console.error("❌ Erreur Dolibarr client :", err.response?.data || err);
    }

    // ➕ Créer client si inexistant
    if (!clientId) {
      console.info("➕ Création nouveau client...");
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
      console.info("✅ Client créé avec ID:", clientId);
    }

    // 📦 Créer facture
    console.info("📦 Traitement des produits :", cart.length);
    const invoiceLines = [];

    for (const product of cart) {
      console.info("🔎 Chargement produit ID:", product.id);
      const res = await axios.get(`${dolibarrAPI}/products/${product.id}`, { headers });
      const prodData = res.data;

      invoiceLines.push({
        fk_product: product.id,
        qty: product.qty,
        subprice: product.price_ht,
        tva_tx: product.tva,
        description: prodData.label
      });
      console.info("✅ Produit ajouté :", prodData.label);
    }

    console.info("🧾 Création facture brouillon...");
    const invoice = {
      socid: clientId,
      lines: invoiceLines,
      note_public: `Commande via site - Paiement : ${paiement.toUpperCase()} - Client : ${customer.nom} ${customer.prenom}`
    };

    const invoiceRes = await axios.post(`${dolibarrAPI}/invoices`, invoice, { headers });
    const invoiceId = invoiceRes.data;
    console.info("✅ Facture créée avec ID :", invoiceId);

    // ✅ Valider la facture
    console.info("📡 Appel validation facture :", `${dolibarrAPI}/invoices/${invoiceId}/validate`);
    await axios.post(`${dolibarrAPI}/invoices/${invoiceId}/validate`, {}, { headers });
    console.info("✅ Facture validée");

    // 💰 Régler la facture si CB uniquement
    if (paiement.toLowerCase() === "cb") {
      console.info("💰 Paiement par CB → déclaration comme PAYÉ");
      await axios.post(`${dolibarrAPI}/invoices/${invoiceId}/set_paid`, {}, { headers });
      console.info("✅ Facture marquée PAYÉE");
    } else {
      console.info("📌 Paiement différé (ex: livraison), facture laissée IMPAYÉE");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, invoiceId })
    };

  } catch (error) {
    console.error("❌ Erreur création commande:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
