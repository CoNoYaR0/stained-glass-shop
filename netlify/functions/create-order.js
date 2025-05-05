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
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Paramètres client ou panier manquants" })
    };
  }

  console.log("💳 Mode de paiement :", paiement);

  const clientEmail = customer.email.trim().toLowerCase();
  const fullName = `${customer.prenom} ${customer.nom}`;
  let clientId;

  // 🔍 Rechercher ou créer le client
  try {
    console.log("🔍 Vérification client existant via email :", clientEmail);
    const res = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
    const existing = res.data.find(c => (c.email || "").toLowerCase() === clientEmail);

    if (existing) {
      clientId = existing.id;
      console.log("✅ Client existant trouvé :", clientId);
    } else {
      throw new Error("Aucun client correspondant");
    }
  } catch (err) {
    if (err.response?.status === 404 || err.message.includes("Aucun client")) {
      console.log("⚠️ Aucun client trouvé. Création d’un nouveau client...");
      try {
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

        console.log("📤 Payload création client :", newClient);

        const createRes = await axios.post(`${DOLIBARR_API}/thirdparties`, newClient, { headers });

        console.log("📥 Résultat création client :", createRes.data);

        clientId = typeof createRes.data === "number" ? createRes.data : createRes.data?.id;
        console.log("✅ Nouveau client créé avec ID :", clientId);
      } catch (creationErr) {
        console.error("❌ Échec création client :", creationErr.response?.data || creationErr.message);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Erreur création client", details: creationErr.message })
        };
      }
    } else {
      console.error("❌ Erreur Dolibarr client :", err.response?.data || err.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur Dolibarr client", details: err.message })
      };
    }
  }

  // 🧾 Construire les lignes de facture
  const lines = [];

  try {
    console.log("📦 Traitement des produits :", cart.length);
    for (const item of cart) {
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

      console.log("✅ Produit ajouté :", product.label);
    }
  } catch (err) {
    console.error("❌ Erreur Dolibarr produits :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur Dolibarr produits", details: err.message })
    };
  }

  // 🧾 Création de la facture
  let factureId;
  try {
    console.log("🧾 Création facture brouillon...");
    const invoice = {
      socid: clientId,
      date: new Date().toISOString().split("T")[0],
      type: 0,
      status: 0,
      lines,
      note_public: `Commande via site - Paiement : ${paiement?.toUpperCase() || "NON PRÉCISÉ"} - Client : ${fullName}`
    };

    const res = await axios.post(`${DOLIBARR_API}/invoices`, invoice, { headers });
    factureId = typeof res.data === "number" ? res.data : res.data?.id;

    console.log("✅ Facture créée avec ID :", factureId);
  } catch (err) {
    console.error("❌ Erreur Dolibarr facture :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur création facture", details: err.message })
    };
  }

  // ✅ VALIDATION FACTURE
  try {
    console.log("🔐 Validation de la facture...");
    const validateRes = await axios.post(`${DOLIBARR_API}/invoices/${factureId}/validate`, {}, { headers });
    console.log("✅ Facture validée :", validateRes.data);

    // 🖨️ Génération PDF
    try {
      console.log("🖨️ Génération PDF...");
      await axios.get(`${DOLIBARR_API}/invoices/${factureId}/generate-pdf`, { headers });
      console.log("✅ PDF généré");

      // 💳 Si paiement CB → enregistrer paiement
      if (paiement === "cb") {
        console.log("💳 Paiement CB → enregistrement paiement...");
        const paiementPayload = {
          facid: factureId,
          datepaye: new Date().toISOString().split("T")[0],
          paiementid: 6, // 6 = CB
          amount: parseFloat(customer.amount),
          accountid: 1 // à adapter selon ton compte bancaire
        };

        const payRes = await axios.post(`${DOLIBARR_API}/payments`, paiementPayload, { headers });
        console.log("✅ Paiement enregistré :", payRes.data);

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            invoiceId: factureId,
            status: "payée",
            pdf: `${DOLIBARR_API}/documents/facture/${factureId}/pdf`
          })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            invoiceId: factureId,
            status: "validée (impayée)",
            pdf: `${DOLIBARR_API}/documents/facture/${factureId}/pdf`
          })
        };
      }
    } catch (pdfErr) {
      console.error("❌ Erreur PDF :", pdfErr.response?.data || pdfErr.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur génération PDF", invoiceId: factureId })
      };
    }
  } catch (err) {
    console.error("⚠️ Facture créée mais erreur validation :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Facture créée mais non validée", invoiceId: factureId })
    };
  }
};
