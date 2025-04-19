const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = "N7qKZ2lzBLhKU7am1iCs2O6wVs9H081b";

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
    // 1️⃣ Cherche client existant
    const clientRes = await axios.get(
      `${DOLIBARR_API}/thirdparties?sqlfilters=(email:=:'${clientEmail}')`,
      { headers }
    );

    let clientId;

    if (clientRes.data.length > 0) {
      clientId = clientRes.data[0].id;
      console.log("✅ Client trouvé :", clientId);
    } else {
      // 2️⃣ Créer nouveau client
      const newClient = {
        name: fullName,
        email: clientEmail,
        client: 1,
        status: 1,
        zip: "0000",
        town: "Tunis",
        address: customer.adresse || "Adresse non renseignée",
        country_id: 1, // Tunisie
      };

      const createRes = await axios.post(`${DOLIBARR_API}/thirdparties`, newClient, { headers });
      clientId = createRes.data;
      console.log("🆕 Client créé :", clientId);
    }

    // 3️⃣ Créer facture brouillon
    const invoiceData = {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      lines: cart.map(p => ({
        desc: `Produit ${p.id}`,
        qty: p.qty,
        subprice: p.price_ht,
        tva_tx: p.tva || 19
      })),
      note_public: `Commande client ${fullName} via ${paiement.toUpperCase()}`,
    };

    const factureRes = await axios.post(`${DOLIBARR_API}/invoices`, invoiceData, { headers });
    const factureId = factureRes.data;
    console.log("🧾 Facture créée (brouillon) :", factureId);

    // 4️⃣ Valider la facture
    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, { headers });
    console.log("✅ Facture validée :", factureId);

    // 5️⃣ Changer statut paiement
    const statusToApply = paiement === "cb" ? 2 : 1; // 2 = paid, 1 = unpaid
    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/setpaid?status=${statusToApply}`, {}, { headers });
    console.log("💰 Statut de paiement défini :", statusToApply === 2 ? "Payé" : "Impayé");

    // 6️⃣ Générer PDF
    await axios.get(`${DOLIBARR_API}/invoices/${factureId}/generate-pdf`, { headers });
    const pdfUrl = `${DOLIBARR_API}/documents/facture/${factureId}/facture.pdf`;
    console.log("📄 PDF généré :", pdfUrl);

    // 7️⃣ Envoi email client
    const emailBody = {
      sendto: clientEmail,
      subject: "📄 Votre facture StainedGlass",
      message: `Bonjour ${fullName},\n\nVeuillez trouver ci-joint votre facture.\n\nMerci pour votre commande 💛\n`,
    };

    await axios.post(`${DOLIBARR_API}/invoices/${factureId}/sendbyemail`, emailBody, { headers });
    console.log("📧 Facture envoyée à :", clientEmail);

    // ✅ Retour final
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
