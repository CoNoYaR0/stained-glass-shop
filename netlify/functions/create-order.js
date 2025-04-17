
const axios = require('axios');

exports.handler = async function (event, context) {
  const customer = {
    email: "testclient@example.com",
    nom: "Doe",
    prenom: "John",
    tel: "99887766",
    adresse: "123 rue du verre"
  };

  try {
    // Étape 1 - Recherche client via proxy
    const encodedFilter = encodeURIComponent(`(email:=:'${customer.email}')`);
    const searchRes = await axios.post("/.netlify/functions/proxy-create-order", {
      method: "GET",
      path: `/thirdparties?sqlfilters=${encodedFilter}`
    });

    if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
      const existingClient = searchRes.data[0];
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Client déjà existant",
          client_id: existingClient.id
        })
      };
    }

    // Étape 2 - Création client via proxy
    const createRes = await axios.post("/.netlify/functions/proxy-create-order", {
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

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Client créé",
        client_id: createRes.data.id || createRes.data
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
