const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  console.log("🔰 Étape 1 : validation requête");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée (POST attendu)" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Corps de requête invalide (JSON attendu)" })
    };
  }

  const { customer, cart, totalTTC, paiement } = body;

  if (!customer || typeof customer !== "object") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Données client manquantes ou invalides" })
    };
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Panier vide ou invalide" })
    };
  }

  if (!totalTTC || isNaN(Number(totalTTC))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Montant total TTC manquant ou invalide" })
    };
  }

  if (!paiement || typeof paiement !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Méthode de paiement manquante ou invalide" })
    };
  }

  console.log("✅ Étape 1 validée : body conforme");

  // 🔎 Étape 2 : recherche ou création client
  const fullName = `${customer.prenom} ${customer.nom}`;
  const clientEmail = customer.email;

  let clientId;

  try {
    const clientRes = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    const clients = clientRes.data;
    const existing = clients.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());

    if (existing && existing.id) {
      clientId = existing.id;
      console.log("✅ Client existant trouvé avec ID :", clientId);
    } else {
      const newClientRes = await axios.post(`${DOLIBARR_API}/thirdparties`, {
        name: fullName,
        email: clientEmail,
        client: 1,
        status: 1,
        zip: "0000",
        town: "Tunis",
        address: customer.adresse || "Adresse non renseignée",
        country_id: 1
      }, { headers });

      clientId = newClientRes.data;
      console.log("✅ Nouveau client créé avec ID :", clientId);
    }

  } catch (err) {
    console.error("❌ Erreur client :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur gestion client",
        message: err.message
      })
    };
  }

  // 📦 Étape 3 : construction des lignes de facture
  let lines = [];

  try {
    for (const item of cart) {
      const productRes = await axios.get(`${DOLIBARR_API}/products/${item.id}`, { headers });
      const product = productRes.data;

      lines.push({
        desc: product.label,
        label: product.label,
        fk_product: product.id,
        qty: item.qty,
        subprice: product.price,
        tva_tx: product.tva_tx || 19,
        product_type: product.fk_product_type || 0,
        remise_percent: 0,
        localtax1_tx: 0,
        localtax2_tx: 0,
        fk_unit: product.fk_unit || 1,
        fk_code_ventilation: 0,
        pa_ht: 0,
        date_start: null,
        date_end: null,
        special_code: 0,
        info_bits: 0,
        fk_remise_except: 0,
        fk_fournprice: 0,
        fk_prev_id: 0,
        array_options: {},
        rang: lines.length + 1,
        situation_percent: 100,
        multicurrency_subprice: product.price
      });

      console.log(`✅ Ligne ajoutée pour produit ${product.ref || product.id}`);
    }

  } catch (err) {
    console.error("❌ Erreur récupération produits :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur produits",
        message: err.message
      })
    };
  }

  // 🧾 Étape 4 : création du brouillon de facture
  let invoiceId;

  try {
    const invoiceRes = await axios.post(`${DOLIBARR_API}/invoices`, {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines,
      note_public: `Commande client ${customer.prenom} ${customer.nom} via ${paiement.toUpperCase()}`
    }, {
      headers,
      responseType: "json"
    });

    if (typeof invoiceRes.data === "number") {
      invoiceId = invoiceRes.data;
    } else if (invoiceRes.data?.id) {
      invoiceId = invoiceRes.data.id;
    } else {
      throw new Error("Réponse Dolibarr invalide : ID manquant");
    }

    console.log("✅ Brouillon de facture créé avec ID :", invoiceId);

  } catch (err) {
    console.error("❌ Erreur création facture :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur création facture",
        message: err.message
      })
    };
  }

  // ✅ TEMPORAIRE — stop ici pour valider l’étape 4
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Étape 4 OK",
      invoiceId
    })
  };
};
