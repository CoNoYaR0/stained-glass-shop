
const axios = require("axios");

const API_BASE = process.env.DOLIBARR_URL + "/index.php";
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

    const clientId = await getOrCreateClient(customer);
    const { invoiceId, invoiceRef } = await createInvoiceDolibarr(clientId, cart);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "✅ Facture créée et validée",
        invoiceId,
        invoiceRef,
      }),
    };
  } catch (err) {
    console.error("❌ Erreur générale:", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

async function getOrCreateClient(customer) {
  const { email, nom, prenom, tel, adresse } = customer;

  try {
    const res = await axios.get(
      `${API_BASE}/thirdparties?sqlfilters=(email:=:'${email}')`,
      { headers }
    );

    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log("✅ Client trouvé:", res.data[0].id);
      return res.data[0].id;
    }

    const createRes = await axios.post(`${API_BASE}/thirdparties`, {
      name: `${prenom} ${nom}`,
      email,
      client: 1,
      phone: tel,
      address: adresse,
    }, { headers });

    console.log("✅ Client créé:", createRes.data.id);
    return createRes.data.id;

  } catch (err) {
    console.error("❌ Erreur client:", err.response?.data || err.message);
    throw new Error("Impossible de récupérer ou créer le client.");
  }
}

async function createInvoiceDolibarr(clientId, cart) {
  try {
    const lines = cart.map((item) => ({
      product_id: item.id,
      qty: item.qty,
      subprice: item.price_ht,
      tva_tx: item.tva || 19,
    }));

    const res = await axios.post(`${API_BASE}/invoices`, {
      socid: clientId,
      lines,
      status: 0,
    }, { headers });

    const invoiceId = res.data.id || res.data;

    if (!invoiceId) throw new Error("❌ Aucun ID de facture retourné");

    await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers });

    const final = await axios.get(`${API_BASE}/invoices/${invoiceId}`, { headers });
    const ref = final.data?.ref || `FACT-${invoiceId}`;

    return { invoiceId, invoiceRef: ref };
  } catch (err) {
    console.error("❌ Erreur facture:", err.response?.data || err.message);
    throw err;
  }
}
