
const axios = require('axios')

const API_BASE = process.env.DOLIBARR_URL
const TOKEN = process.env.DOLIBARR_TOKEN

const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
}

// 💡 Appel principal pour Netlify ou test
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body)
    const { clientId, cart, orderId } = data

    if (!clientId || !Array.isArray(cart) || !orderId) {
      throw new Error("❌ Données manquantes : clientId, cart ou orderId")
    }

    // Étape 1️⃣ Créer une facture en brouillon
    const lines = cart.map(p => ({
      product_id: p.id,
      qty: p.qty,
      subprice: p.price_ht,
      tva_tx: p.tva || 19
    }))

    const factureRes = await axios.post(`${API_BASE}/invoices`, {
      socid: parseInt(clientId),
      lines,
      source: 'commande',
      fk_source: orderId,
      status: 0
    }, { headers })

    const invoiceId = factureRes.data.id
    if (!invoiceId) {
      throw new Error("❌ Échec récupération ID facture après création")
    }

    console.log("🧾 Facture brouillon créée avec succès. ID:", invoiceId)

    // Étape 2️⃣ Validation de la facture
    try {
      const validation = await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers })
      console.log("✅ Facture validée Dolibarr :", validation.status, validation.data)
    } catch (err) {
      console.error("❌ Erreur à la validation :", err.response?.data || err.message)
      throw new Error("❌ La validation de la facture a échoué")
    }

    // Étape 3️⃣ On retourne juste l’ID
    return {
      statusCode: 200,
      body: JSON.stringify({ invoiceId })
    }

  } catch (error) {
    console.error("❌ Erreur générale:", error.message || error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
