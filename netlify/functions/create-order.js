
const axios = require('axios');

exports.handler = async function (event, context) {
  const PROXY_URL = process.env.PROXY_URL;

  const customer = {
    email: "testclient@example.com",
    nom: "Doe",
    prenom: "John",
    tel: "99887766",
    adresse: "123 rue du verre"
  };

  try {
    console.log("🔍 Étape 1 : recherche du client par email...");

    const encodedFilter = encodeURIComponent(`(email:=:'${customer.email}')`);
    const searchRes = await axios.post(PROXY_URL, {
      method: "GET",
      path: `/thirdparties?sqlfilters=${encodedFilter}`
    });

    const found = searchRes.data;

    if (Array.isArray(found) && found.length > 0) {
      console.log("✅ Client existant trouvé :", found[0].id);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Client déjà existant",
          client_id: found[0].id
        })
      };
    }

    console.log("➕ Aucun client trouvé, création...");

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

    const created = createRes.data;

    console.log("✅ Client créé avec succès :", created.id || created);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Client créé",
        client_id: created.id || created
      })
    };
  } catch (error) {
    console.error("❌ Erreur proxy client:", error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: error.response?.data || error.message })
    };
  }
};
