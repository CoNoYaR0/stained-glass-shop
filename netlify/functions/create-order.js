const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const DOLAPIKEY = process.env.DOLIBARR_TOKEN; // à configurer dans Netlify env vars

const headers = {
  DOLAPIKEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  console.log("🔰 Étape 1 : validation requête");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Méthode non autorisée" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide" }) };
  }

  const { customer, cart, totalTTC, paiement } = body;

  if (!customer || !Array.isArray(cart) || cart.length === 0 || isNaN(Number(totalTTC))) {
    return { statusCode: 400, body: JSON.stringify({ error: "Paramètres manquants ou invalides" }) };
  }

  console.log("✅ Étape 1 validée : body conforme");

  // 🔎 Étape 2 : Vérifier ou créer le client
  const fullName = `${customer.prenom} ${customer.nom}`;
  const clientEmail = customer.email;
  let clientId;

  try {
    const res = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    const existing = res.data.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());

    if (existing) {
      clientId = existing.id;
      console.log("✅ Client existant :", clientId);
    } else {
      const createRes = await axios.post(`${DOLIBARR_API}/thirdparties`, {
        name: fullName,
        email: clientEmail,
        client: 1,
        status: 1,
        zip: "0000",
        town: "Tunis",
        address: customer.adresse || "Adresse non renseignée",
        country_id: 1
      }, { headers });

      clientId = createRes.data;
      console.log("✅ Nouveau client créé :", clientId);
    }
  } catch (err) {
    console.error("❌ Client:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur client", message: err.message }) };
  }

  // 📦 Étape 3 : Préparer les lignes
  const lines = [];

  try {
    for (const item of cart) {
      const prodRes = await axios.get(`${DOLIBARR_API}/products/${item.id}`, { headers });
      const product = prodRes.data;

      lines.push({
        desc: product.label,
        label: product.label,
        fk_product: product.id,
        qty: item.qty,
        subprice: product.price,
        tva_tx: product.tva_tx || 19,
        product_type: product.fk_product_type || 0,
        fk_unit: product.fk_unit || 1
      });

      console.log(`✅ Ligne : ${product.label}`);
    }
  } catch (err) {
    console.error("❌ Produits:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur produits", message: err.message }) };
  }

  // 🧾 Étape 4 : Créer la facture
  try {
    const factureRes = await axios.post(`${DOLIBARR_API}/invoices`, {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines,
      note_public: `Commande client ${fullName} via ${paiement.toUpperCase()}`
    }, { headers });

    const invoiceId = typeof factureRes.data === "number"
      ? factureRes.data
      : factureRes.data?.id;

    if (!invoiceId) throw new Error("Réponse Dolibarr invalide");

    console.log("✅ Facture créée ID:", invoiceId);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, invoiceId })
    };
  } catch (err) {
    console.error("❌ Facture:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur facture", message: err.message }) };
  }
};
