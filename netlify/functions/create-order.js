const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  console.log("🔰 Étape 1 : validation requête");

  // Refuser toute méthode autre que POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée (POST attendu)" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Corps de requête invalide (JSON attendu)" })
    };
  }

  // Validation des champs requis
  const { customer, cart, totalTTC, paiement } = body;

  if (!customer || typeof customer !== "object") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Données client manquantes ou invalides" })
    };
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Panier vide ou invalide" })
    };
  }

  if (!totalTTC || isNaN(Number(totalTTC))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Montant total TTC manquant ou invalide" })
    };
  }

  if (!paiement || typeof paiement !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Méthode de paiement manquante ou invalide" })
    };
  }

  console.log("✅ Étape 1 validée : body conforme");

  // ⚠️ TEMPORAIRE : stop ici pour test uniquement l'étape 1
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: "Étape 1 OK" })
  };
};

// Étape 2 : Vérification ou création du client Dolibarr
console.log("🔎 Étape 2 : recherche ou création client");

const fullName = `${customer.prenom} ${customer.nom}`;
const clientEmail = customer.email;

let clientId;

try {
  // 1. Recherche du client existant
  const clientRes = await axios.get(`${DOLIBARR_API}/thirdparties?limit=100`, { headers });
  const clients = clientRes.data;

  const existing = clients.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());

  if (existing && existing.id) {
    clientId = existing.id;
    console.log("✅ Client existant trouvé avec ID :", clientId);
  } else {
    // 2. Création nouveau client
    console.log("➕ Client non trouvé, création…");

    const newClientRes = await axios.post(`${DOLIBARR_API}/thirdparties`, {
      name: fullName,
      email: clientEmail,
      client: 1,
      status: 1,
      zip: "0000",
      town: "Tunis",
      address: customer.adresse || "Adresse non renseignée",
      country_id: 1
    }, { headers });

    clientId = newClientRes.data;
    console.log("✅ Nouveau client créé avec ID :", clientId);
  }

} catch (err) {
  console.error("❌ Erreur lors de la recherche ou création du client :", err.message);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "Erreur Dolibarr lors de la gestion client",
      message: err.message
    })
  };
}

// ⚠️ TEMPORAIRE — stop ici pour valider l'étape 2
return {
  statusCode: 200,
  body: JSON.stringify({
    success: true,
    message: "Étape 2 OK",
    clientId
  })
};
