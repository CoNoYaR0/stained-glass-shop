const axios = require("axios");

const API_BASE = process.env.DOLIBARR_URL;
const TOKEN = process.env.DOLIBARR_TOKEN;
const headers = {
  DOLAPIKEY: TOKEN,
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { customer, cart, totalTTC } = data;

    if (!customer || !cart?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données manquantes (client ou cart)" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Étape 1 validée, données reçues", customer, cart }),
    };
  } catch (err) {
    console.error("❌ Erreur générale:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

async function createInvoiceDolibarr(clientId, cart) {
  try {
    const lines = cart.map((item) => ({
      product_id: item.id,
      qty: item.qty,
      subprice: item.price_ht,
      tva_tx: item.tva || 19,
    }));

    // Créer la facture
    const res = await axios.post(`${API_BASE}/invoices`, {
      socid: clientId,
      lines,
      status: 0,
    }, { headers });

    const invoiceId = res.data.id || res.data;

    if (!invoiceId) throw new Error("❌ Aucun ID de facture retourné");

    // Valider la facture
    await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers });

    // Récupérer les infos finales (dont ref)
    const final = await axios.get(`${API_BASE}/invoices/${invoiceId}`, { headers });

    const ref = final.data?.ref || `FACT-${invoiceId}`;

    return { invoiceId, invoiceRef: ref };
  } catch (err) {
    console.error("❌ Erreur facture:", err.response?.data || err.message);
    throw err;
  }
}
