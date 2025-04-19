const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  "DOLAPIKEY": API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  console.log("📥 Reçu commande pour création dans Dolibarr");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
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
    const clientRes = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    let client = clientRes.data.find(cli => cli.email?.toLowerCase() === clientEmail.toLowerCase());

    let clientId;

    if (client) {
      clientId = client.id;
      console.log("✅ Client trouvé :", clientId);
    } else {
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
      console.log("🆕 Client créé :", clientId);
    }

    // ✅ Construction des lignes
    const invoiceLines = cart.map((p, i) => ({
      desc: `Produit ${p.id}`,
      product_type: 0,
      qty: p.qty,
      subprice: p.price_ht,
      tva_tx: p.tva || 19,
      fk_product: parseInt(p.id),
      remise_percent: 0,
      rang: i + 1
    }));

    const invoiceData = {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines: invoiceLines,
      note_public: `Commande client ${fullName} via ${paiement.toUpperCase()}`
    };

    const factureRes = await axios.post(`${DOLIBARR_API}/invoices`, invoiceData, { headers });
    const factureId = factureRes.data;
    console.log("🧾 Facture créée (brouillon) :", factureId);

    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, { headers });
    console.log("✅ Facture validée :", factureId);

    await axios.get(`${DOLIBARR_API}/invoices/${factureId}/generate-pdf`, { headers });
    const pdfUrl = `${DOLIBARR_API}/documents/facture/${factureId}/facture.pdf`;
    console.log("📄 PDF généré :", pdfUrl);

    const emailBody = {
      sendto: clientEmail,
      subject: "📄 Votre facture StainedGlass",
      message: `Bonjour ${fullName},\n\nVeuillez trouver ci-joint votre facture.\n\nMerci pour votre commande 💛\n`
    };

    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/sendbyemail`, emailBody, { headers });
    console.log("📧 Facture envoyée à :", clientEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        facture: {
          id: factureId,
          ref: `F-${factureId}`,
          pdfUrl
        }
      })
    };
  } catch (err) {
    console.error("💥 Erreur Dolibarr :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Dolibarr", details: err.message })
    };
  }
};
