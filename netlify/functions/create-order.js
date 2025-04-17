// netlify/functions/create-order.js

const axios = require("axios");

const PROXY_URL = process.env.PROXY_URL;

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { customer, cart } = data;

    if (!customer || !cart?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données manquantes (client ou cart)" })
      };
    }

    // 🔍 Étape 1 : Vérifier si client existe
    const encodedFilter = encodeURIComponent(`(email:=:'${customer.email}')`);
    const searchRes = await axios.post(PROXY_URL, {
      method: "GET",
      path: `/thirdparties?sqlfilters=${encodedFilter}`
    });

    let clientId;
    if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
      clientId = searchRes.data[0].id;
    } else {
      // ➕ Étape 2 : Créer le client
      const createRes = await axios.post(PROXY_URL, {
        method: "POST",
        path: "/thirdparties",
        body: {
          name: `${customer.nom} ${customer.prenom}`,
          email: customer.email,
          phone: customer.tel,
          address: customer.adresse,
          client: 1
        }
      });
      clientId = createRes.data.id || createRes.data;
    }

    // 🧾 Étape 3 : Créer la facture
    const lines = cart.map((item) => ({
      product_id: item.id,
      qty: item.qty,
      subprice: item.price_ht,
      tva_tx: item.tva || 19
    }));

    const invoiceRes = await axios.post(PROXY_URL, {
      method: "POST",
      path: "/invoices",
      body: {
        socid: clientId,
        lines,
        status: 0
      }
    });

    const invoiceId = invoiceRes.data.id || invoiceRes.data;

    // ✅ Étape 4 : Valider la facture
    await axios.post(PROXY_URL, {
      method: "POST",
      path: `/invoices/${invoiceId}/validate`,
      body: {}
    });

    // 📄 Étape 5 : Récupérer les infos de la facture
    const finalInvoice = await axios.post(PROXY_URL, {
      method: "GET",
      path: `/invoices/${invoiceId}`
    });

    const invoiceRef = finalInvoice.data.ref || `FACT-${invoiceId}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Facture créée et validée",
        invoiceId,
        invoiceRef
      })
    };
  } catch (err) {
    console.error("❌ Erreur create-order:", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};