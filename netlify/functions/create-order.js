
const axios = require("axios");

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { customer, cart, totalTTC } = data;

    console.log("🟡 Étape 1: Données reçues", { customer, cart, totalTTC });

    if (!customer || !cart?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données manquantes (client ou cart)" }),
      };
    }

    const clientId = await getOrCreateClient(customer);
    console.log("🟢 Étape 2: ID client récupéré ou créé =>", clientId);

    const { invoiceId, invoiceRef } = await createInvoiceDolibarr(clientId, cart);
    console.log("🟢 Étape 3: Facture créée et validée =>", { invoiceId, invoiceRef });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "✅ Facture créée et validée via proxy",
        invoiceId,
        invoiceRef,
      }),
    };
  } catch (err) {
    console.error("❌ Erreur finale:", err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

async function getOrCreateClient(customer) {
  const { email, nom, prenom, tel, adresse } = customer;
  const encodedFilter = encodeURIComponent(`(email:=:'${email}')`);
  try {
    console.log("🔍 Recherche du client existant...");
    const res = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "GET",
      path: `/thirdparties?sqlfilters=${encodedFilter}`
    });

    const found = res.data;
    if (Array.isArray(found) && found.length > 0) {
      console.log("✅ Client trouvé:", found[0].id);
      return found[0].id;
    }

    console.log("➕ Client non trouvé, création en cours...");
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

    console.log("✅ Client créé avec ID:", createRes.data.id);
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

    console.log("🧾 Création facture pour client:", clientId);
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
    console.log("📄 ID facture:", invoiceId);

    console.log("🔐 Validation de la facture...");
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
    console.error("❌ Erreur création facture:", err.response?.data || err.message);
    throw err;
  }
}
