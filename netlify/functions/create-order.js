const axios = require("axios");
const zlib = require("zlib");

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
  console.log("✅ Version PATCHÉE CHARGÉE");

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
    }, {
      headers,
      responseType: "arraybuffer"
    });

    console.log("📨 Réponse brute (buffer):", invoiceRes.data?.slice?.(0, 20));

    let factureId;

    try {
      const raw = invoiceRes.data;
      const isGzip = raw[0] === 0x1f && raw[1] === 0x8b;
      console.log("🔍 GZIP ?", raw[0], raw[1], "->", isGzip);

      let jsonData;

      if (isGzip) {
        const uncompressed = zlib.gunzipSync(raw).toString("utf8");
        console.log("🗃️ Réponse décompressée (début):", uncompressed.slice(0, 100));
        jsonData = JSON.parse(uncompressed);
      } else {
        const str = raw.toString("utf8");
        console.log("🗃️ Réponse brute (début):", str.slice(0, 100));
        jsonData = JSON.parse(str);
      }

      if (typeof jsonData === "number") {
        factureId = jsonData;
      } else if (jsonData?.id) {
        factureId = jsonData.id;
      } else {
        throw new Error("Format de retour inattendu de Dolibarr");
      }

    } catch (err) {
      console.error("❌ Erreur parsing retour Dolibarr:", err.message);
      console.log("🧾 Donnée brute (hex):", invoiceRes.data.toString("hex").slice(0, 200));
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Erreur parsing réponse Dolibarr",
          message: err.message
        })
      };
    }

    console.log("🧾 ID de la facture brouillon:", factureId);

    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, {
      headers: {
        DOLAPIKEY: API_KEY,
        "Accept-Encoding": "identity"
      },
      responseType: "arraybuffer"
    });

    if (paiement === "cb") {
      console.log("⏳ Paiement CB en attente de confirmation via Paymee (webhook)");
    } else {
      console.log("🚚 Paiement à la livraison, aucun statut de paiement modifié.");
    }

    const getFacture = await axios.get(`${DOLIBARR_API}/invoices/${factureId}`, { headers });
    const status = getFacture.data.status;
    console.log("📋 État final post-validation:", status);

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
