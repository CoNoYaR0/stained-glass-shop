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

  const lines = [];

  try {
    console.log("📦 Traitement des produits :", cart.length);
    for (const item of cart) {
      console.log("🔎 Chargement produit ID:", item.id);
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

  let statusFacture = "validée";

  // ✅ VALIDATION
  try {
    const validateUrl = `${DOLIBARR_API}/invoices/${factureId}/validate`;
    console.log("📡 Appel validation facture :", validateUrl);
    const validateRes = await axios.post(validateUrl, {}, { headers });
    console.log("✅ Facture validée :", validateRes.data);
  } catch (err) {
    console.error("❌ Erreur validation facture :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Facture créée mais non validée",
        invoiceId: factureId,
        details: err.response?.data || err.message
      })
    };
  }

  // 📄 GÉNÉRATION PDF (CORRECTIF)
  try {
    const pdfUrl = `${DOLIBARR_API}/invoices/${factureId}/generate-document`;
    console.log("📄 Appel génération PDF (POST) :", pdfUrl);
    await axios.post(pdfUrl, { model: "standard" }, { headers });
    console.log("✅ PDF généré avec modèle 'standard'");
  } catch (err) {
    console.error("❌ Erreur génération PDF :", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "PDF non généré", invoiceId: factureId })
    };
  }

  // 💳 PAIEMENT SI CB
  if (paiement === "cb") {
    try {
      console.log("💳 Paiement CB → enregistrement...");
      const paiementPayload = {
        facid: factureId,
        datepaye: new Date().toISOString().split("T")[0],
        paiementid: 6,
        amount: parseFloat(customer.amount),
        accountid: 1
      };

      const payRes = await axios.post(`${DOLIBARR_API}/payments`, paiementPayload, { headers });
      console.log("✅ Paiement CB enregistré :", payRes.data);
      statusFacture = "payée";
    } catch (err) {
      console.error("❌ Erreur enregistrement paiement CB :", err.response?.data || err.message);
      statusFacture = "validée (non payée)";
    }
  } else {
    console.log("📦 Paiement = livraison → pas de règlement enregistré.");
    statusFacture = "validée (non payée)";
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      invoiceId: factureId,
      status: statusFacture,
      pdf: `${DOLIBARR_API}/documents/facture/${factureId}/standard.pdf`
    })
  };
};
