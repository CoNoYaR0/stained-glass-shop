const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  try {
    const data = JSON.parse(event.body);
    console.log("🟡 Étape 1 : Données reçues", data);

    const { customer, cart } = data;

    if (!customer?.email || !cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données client ou cart manquantes" }),
      };
    }

    const proxyUrl = "/.netlify/functions/proxy-create-order";

    // Recherche du client
    console.log("🔍 Étape 2 : Recherche du client par email...");
    const searchClientRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "thirdparties",
        query: `?sqlfilters=(email:=:'${customer.email}')`,
        method: "GET",
      }),
    });

    const searchClientData = await searchClientRes.json();
    console.log("🔎 Résultat recherche client:", searchClientData);

    let socid;

    if (Array.isArray(searchClientData) && searchClientData.length > 0) {
      socid = searchClientData[0].id;
      console.log("✅ Client trouvé avec ID:", socid);
    } else {
      console.log("➕ Client non trouvé, création...");

      const createClientRes = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "thirdparties",
          method: "POST",
          body: {
            name: `${customer.nom} ${customer.prenom}`,
            email: customer.email,
            client: 1,
            address: customer.adresse || "",
            zip: "00000",
            town: "N/A",
            country_id: "1",
          },
        }),
      });

      const createClientData = await createClientRes.json();
      if (!createClientRes.ok || !createClientData.id) {
        console.error("❌ Erreur création client:", createClientData);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Échec création client" }),
        };
      }

      socid = createClientData.id;
      console.log("✅ Client créé avec ID:", socid);
    }

    // Création de la facture
    console.log("🧾 Étape 3 : Création facture...");

    const invoiceRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "invoices",
        method: "POST",
        body: {
          socid,
          lines: cart.map((item) => ({
            product_id: item.id,
            qty: item.qty,
            subprice: item.price_ht,
            tva_tx: item.tva,
          })),
        },
      }),
    });

    const invoiceData = await invoiceRes.json();
    if (!invoiceRes.ok || !invoiceData.id) {
      console.error("❌ Erreur création facture:", invoiceData);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Échec création facture" }),
      };
    }

    const invoiceId = invoiceData.id;
    console.log("✅ Facture créée avec ID:", invoiceId);

    // Validation facture
    console.log("✅ Étape 4 : Validation facture...");

    const validateRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `invoices/${invoiceId}/validate`,
        method: "POST",
      }),
    });

    if (!validateRes.ok) {
      const err = await validateRes.text();
      console.error("❌ Erreur validation facture:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur validation facture" }),
      };
    }

    console.log("✅ Facture validée");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, invoice_id: invoiceId }),
    };
  } catch (err) {
    console.error("❌ Erreur générale:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur interne" }),
    };
  }
};