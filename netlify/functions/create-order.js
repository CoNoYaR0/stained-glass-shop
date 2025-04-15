
const axios = require('axios')

const API_BASE = process.env.DOLIBARR_URL
const TOKEN = process.env.DOLIBARR_TOKEN

const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body)
    const { clientId, cart, orderId } = data

    if (!clientId || !Array.isArray(cart) || !orderId) {
      throw new Error("❌ Données manquantes : clientId, cart ou orderId")
    }

    const lines = cart.map(p => ({
      product_id: p.id,
      qty: p.qty,
      subprice: p.price_ht,
      tva_tx: p.tva || 19
    }))

    console.log("📦 Création facture...")
    const factureRes = await axios.post(`${API_BASE}/invoices`, {
      socid: parseInt(clientId),
      lines,
      source: 'commande',
      fk_source: orderId,
      status: 0
    }, { headers })

    console.log("📨 Réponse brute de Dolibarr :")
    console.log("Status:", factureRes.status)
    console.log("Data:", JSON.stringify(factureRes.data, null, 2))

    const invoiceId = typeof factureRes.data === 'object' ? factureRes.data.id : factureRes.data
    if (!invoiceId) {
      throw new Error("❌ Échec récupération ID facture après création")
    }

    console.log("🧾 Facture brouillon créée, ID :", invoiceId)

    const validation = await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers })
    console.log("✅ Facture validée :", validation.status, validation.data)

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
