const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

async function buildInvoiceLines(cart, headers) {
  const lines = [];

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const res = await axios.get(`${DOLIBARR_API}/products/${item.id}`, { headers });
    const product = res.data;

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
      rang: i + 1,
      situation_percent: 100,
      multicurrency_subprice: product.price
    });
  }

  return lines;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "JSON invalide" })
    };
  }

  const { customer, cart, totalTTC, paiement } = body;
  if (!customer || !cart || !totalTTC || !paiement) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Champs requis manquants" })
    };
  }

  const fullName = `${customer.prenom} ${customer.nom}`;
  const clientEmail = customer.email;

  try {
    console.log("🔍 Vérification client existant...");
    const clients = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    let client = clients.data.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());
    let clientId = client?.id;

    if (!clientId) {
      console.log("➕ Création nouveau client");
      const newClient = await axios.post(`${DOLIBARR_API}/thirdparties`, {
        name: fullName,
        email: clientEmail,
        client: 1,
        status: 1,
        zip: "0000",
        town: "Tunis",
        address: customer.adresse || "Adresse non renseignée",
        country_id: 1
      }, { headers });
      clientId = newClient.data;
      console.log("✅ Client créé avec ID:", clientId);
    } else {
      console.log("✅ Client trouvé avec ID:", clientId);
    }

    console.log("📦 Construction des lignes...");
    const lines = await buildInvoiceLines(cart, headers);

    console.log("🧾 Création facture brouillon...");
    const invoiceRes = await axios.post(`${DOLIBARR_API}/invoices`, {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines,
      note_public: `Commande client ${fullName} via ${paiement.toUpperCase()}`
    }, { headers });

    const factureId = invoiceRes.data;
    console.log("🧾 ID de la facture brouillon:", factureId);

    if (!factureId || isNaN(factureId)) {
      throw new Error("ID de facture invalide");
    }

    console.log("🛠️ Début validation de la facture ID:", factureId);
    const validationUrl = `${DOLIBARR_API}/invoices/${factureId}/validate`;

    console.log("📡 URL :", validationUrl);
    console.log("📤 Headers envoyés :", {
      DOLAPIKEY: API_KEY,
      "Content-Type": "application/json"
    });
    console.log("📦 Body envoyé : {}");

    try {
      const validation = await axios.post(validationUrl, {}, {
        headers: {
          DOLAPIKEY: API_KEY,
          "Content-Type": "application/json"
        },
        
      });

      console.log("✅ Validation OK");
      console.log("🔢 Status HTTP :", validation.status);
      console.log("📄 Headers réponse :", validation.headers);
      console.log("📐 Type réponse :", typeof validation.data);
      console.log("📏 Taille réponse (bytes) :", Buffer.byteLength(validation.data));

    } catch (validationError) {
      console.error("❌ Erreur validation facture :", validationError.message);
      if (validationError.response) {
        console.error("📄 Status :", validationError.response.status);
        console.error("📄 Headers :", validationError.response.headers);
        console.error("📄 Data type :", typeof validationError.response.data);
      }

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Erreur validation facture",
          message: validationError.message
        })
      };
    }

    const getFacture = await axios.get(`${DOLIBARR_API}/invoices/${factureId}`, { headers });
    const status = getFacture.data.status;
    console.log("📋 État final post-validation:", status);

    if (status !== 1) {
      throw new Error("❌ Facture toujours en brouillon après tentative de validation");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        facture: {
          id: factureId,
          statut: status
        }
      })
    };

  } catch (err) {
    console.error("💥 Erreur générale :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur Dolibarr",
        message: err.message
      })
    };
  }
};