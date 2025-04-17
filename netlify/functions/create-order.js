
const axios = require("axios");

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
        message: "✅ Facture créée et validée via proxy",
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
    const res = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "GET",
      path: `/thirdparties?sqlfilters=(email:=:'${email}')`
    });

    const found = res.data;
    if (Array.isArray(found) && found.length > 0) {
      console.log("✅ Client trouvé:", found[0].id);
      return found[0].id;
    }

    const createRes = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "POST",
      path: "/thirdparties",
      body: {
        name: `${prenom} ${nom}`,
        email,
        client: 1,
        phone: tel,
        address: adresse
      }
    });

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

    const create = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "POST",
      path: "/invoices",
      body: {
        socid: clientId,
        lines,
        status: 0
      }
    });

    const invoiceId = create.data.id || create.data;
    if (!invoiceId) throw new Error("❌ Aucun ID de facture retourné");

    await axios.post("/.netlify/functions/proxy-create-order", {
      method: "POST",
      path: `/invoices/${invoiceId}/validate`,
      body: {}
    });

    const final = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "GET",
      path: `/invoices/${invoiceId}`
    });

    const ref = final.data?.ref || `FACT-${invoiceId}`;
    return { invoiceId, invoiceRef: ref };
  } catch (err) {
    console.error("❌ Erreur facture:", err.response?.data || err.message);
    throw err;
  }
}
