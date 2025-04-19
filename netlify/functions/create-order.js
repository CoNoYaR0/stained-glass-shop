const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  "DOLAPIKEY": API_KEY,
  "Content-Type": "application/json"
};

// 🔧 Ligne de facture complète pour Dolibarr
async function buildInvoiceLines(cart, headers) {
  const lines = [];

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const id = parseInt(item.id);

    const res = await axios.get(`${DOLIBARR_API}/products/${id}`, { headers });
    const product = res.data;

    const line = {
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
    };

    lines.push(line);
  }

  return lines;
}

exports.handler = async function (event) {
  console.log("📥 Reçu commande pour création dans Dolibarr");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Méthode non autorisée" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON invalide" }) };
  }

  const { customer, cart, totalTTC, paiement } = body;
  if (!customer || !cart || !totalTTC || !paiement) {
    return { statusCode: 400, body: JSON.stringify({ error: "Champs requis manquants" }) };
  }

  const fullName = `${customer.prenom} ${customer.nom}`;
  const clientEmail = customer.email;

  try {
    // 1️⃣ Recherche ou création du client
    const clientRes = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    let client = clientRes.data.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());
    let clientId = client?.id;

    if (!client) {
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
      console.log("🆕 Client créé :", clientId);
    } else {
      console.log("✅ Client trouvé :", clientId);
    }

    // 2️⃣ Génération des lignes complètes
    const invoiceLines = await buildInvoiceLines(cart, headers);

    // 3️⃣ Création de la facture (brouillon)
    const invoiceData = {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines: invoiceLines,
      note_public: `Commande client ${fullName} via ${paiement.toUpperCase()}`
    };

    const factureRes = await axios.post(`${DOLIBARR_API}/invoices`, invoiceData, { headers });
    const factureId = factureRes.data;

    if (!factureId || isNaN(factureId)) throw new Error("❌ ID de facture manquant après création");

    console.log("🧾 Facture brouillon créée : ID", factureId);

    // 4️⃣ Validation de la facture
    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, { headers });
    console.log("✅ Facture validée :", factureId);

    // 5️⃣ Paiement ou non selon méthode
    if (paiement === "cb") {
      const today = new Date().toISOString().split("T")[0];
      await axios.post(`${DOLIBARR_API}/invoices/${factureId}/settlements`, {
        datepaye: today,
        amount: totalTTC,
        payment_type: 1, // 💳 CB = ID 1 par défaut
        closepaidinvoices: 1
      }, { headers });
      console.log("💳 Paiement enregistré : CB");
    } else {
      console.log("🚚 Paiement à la livraison, facture reste impayée");
    }

    // 6️⃣ Génération PDF
    await axios.get(`${DOLIBARR_API}/invoices/${factureId}/generate-pdf`, { headers });
    const pdfUrl = `${DOLIBARR_API}/documents/facture/${factureId}/facture.pdf`;
    console.log("📄 PDF généré :", pdfUrl);

    // 7️⃣ Envoi email
    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/sendbyemail`, {
      sendto: clientEmail,
      subject: "📄 Votre facture StainedGlass",
      message: `Bonjour ${fullName},\n\nVeuillez trouver ci-joint votre facture.\n\nMerci pour votre commande 💛\n`
    }, { headers });

    console.log("📧 Facture envoyée à :", clientEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        facture: {
          id: factureId,
          pdfUrl
        }
      })
    };
  } catch (err) {
    console.error("💥 Erreur Dolibarr :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur Dolibarr",
        details: err.response?.data || err.message
      })
    };
  }
};
