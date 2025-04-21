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

    let factureId;

    if (typeof invoiceRes.data === "number") {
      factureId = invoiceRes.data;
      console.log("🧾 Facture ID (number) :", factureId);
    } else {
      const raw = Buffer.from(invoiceRes.data);
      let parsed;
      const zlib = require("zlib");

      try {
        const isGzip = raw[0] === 0x1f && raw[1] === 0x8b;

        if (isGzip) {
          const uncompressed = zlib.gunzipSync(raw).toString();
          parsed = JSON.parse(uncompressed);
        } else {
          parsed = JSON.parse(raw.toString());
        }

        factureId = parsed;
        console.log("🧾 Facture ID (parsed):", factureId);
      } catch (err) {
        console.error("❌ Erreur parsing facture ID:", err.message);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Erreur parsing ID facture",
            message: err.message
          })
        };
      }
    }
    console.log("🧾 ID de la facture brouillon:", factureId);

    if (!factureId || isNaN(factureId)) {
      throw new Error("ID de facture invalide");
    }

    console.log("📤 Headers envoyés :");
    console.log("📦 Body envoyé : {}");

    
    // ✅ Validation via l’API REST officielle Dolibarr
    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, {
      headers: {
        DOLAPIKEY: API_KEY,
        "Accept-Encoding": "identity"
      },
      responseType: "arraybuffer"
    });
    console.log("✅ Validation effectuée via API officielle");

// 💳 Paiement CB détecté, en attente de confirmation par webhook Paymee
    if (paiement === "cb") {
      console.log("⏳ Paiement CB en attente de confirmation via Paymee (webhook)");
    } else {
      console.log("🚚 Paiement à la livraison, aucun statut de paiement modifié.");
    }
    }
    

    const getFacture = await axios.get(`${DOLIBARR_API}/invoices/${factureId}`, { headers });
    const status = getFacture.data.status;
    console.log("📋 État final post-validation:", status);

    if (status !== 1) {
  console.warn("⚠️ Facture validée mais status inattendu :", status);
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