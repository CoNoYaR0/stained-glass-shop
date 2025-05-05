const axios = require("axios");

const DOLIBARR_API = process.env.DOLIBARR_API;
const DOLAPIKEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY,
  "Content-Type": "application/json",
  Accept: "application/json"
};

exports.handler = async function (event) {
  console.log("🚀 create-order lancé");

  if (event.httpMethod !== "POST") {
    console.warn("❌ Mauvaise méthode HTTP");
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
    console.log("📥 Body reçu et parsé :", data);
  } catch (err) {
    console.error("❌ JSON invalide :", err.message);
    return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide" }) };
  }

  const { customer, cart, paiement } = data;

  if (!customer || !Array.isArray(cart) || cart.length === 0) {
    console.warn("❌ Données manquantes :", { customer, cart });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Paramètres client ou panier manquants" })
    };
  }

  console.log("💳 Mode de paiement :", paiement);

  const clientEmail = customer.email.trim().toLowerCase();
  const fullName = `${customer.prenom} ${customer.nom}`;
  let clientId;

  try {
    console.log("🔍 Vérification client existant via email :", clientEmail);
    const res = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    const existing = res.data.find(c => (c.email || "").toLowerCase() === clientEmail);

    if (existing) {
      clientId = existing.id;
      console.log("✅ Client existant trouvé :", clientId);
    } else {
      console.log("➕ Client non trouvé, création en cours");
      const newClient = {
        name: fullName,
        email: clientEmail,
        client: 1,
        status: 1,
        zip: "0000",
        town: "Tunis",
        address: customer.adresse || "Adresse non renseignée",
        country_id: 1
      };

      const createRes = await axios.post(`${DOLIBARR_API}/thirdparties`, newClient, { headers });
      clientId = createRes.data;
      console.log("✅ Nouveau client créé :", clientId);
    }
  } catch (err) {
    console.error("❌ Erreur Dolibarr client :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Dolibarr client", details: err.message })
    };
  }

  const lines = [];

  try {
    console.log("📦 Traitement des produits :", cart.length, "article(s)");
    for (const item of cart) {
      console.log("🔍 Produit ID:", item.id);
      const productRes = await axios.get(`${DOLIBARR_API}/products/${item.id}`, { headers });
      const product = productRes.data;

      lines.push({
        fk_product: product.id,
        label: product.label || product.ref,
        qty: item.qty,
        subprice: parseFloat(product.price),
        tva_tx: parseFloat(product.tva_tx) || 19.0,
        product_type: product.fk_product_type || 0
      });

      console.log("✅ Produit ajouté à la commande :", product.label);
    }
  } catch (err) {
    console.error("❌ Erreur Dolibarr produits :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Dolibarr produits", details: err.message })
    };
  }

  try {
    console.log("🧾 Création facture brouillon pour client ID:", clientId);
    const invoice = {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      type: 0,
      status: 0,
      lines,
      note_public: `Commande via site - Paiement : ${paiement?.toUpperCase() || "NON PRÉCISÉ"} - Client : ${fullName}`
    };

    const res = await axios.post(`${DOLIBARR_API}/invoices`, invoice, { headers });
    const factureId = typeof res.data === "number" ? res.data : res.data?.id;

    console.log("✅ Facture créée avec ID :", factureId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, invoiceId: factureId })
    };
  } catch (err) {
    console.error("❌ Erreur Dolibarr facture :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Dolibarr facture", details: err.message })
    };
  }
};
