
const axios = require('axios')

const API_BASE = process.env.DOLIBARR_URL
const TOKEN = process.env.DOLIBARR_TOKEN

const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
}

// ✅ Entry Point
exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body)
    const { clientId, cart, orderId } = data

    if (!clientId || !Array.isArray(cart) || !orderId) {
      throw new Error("❌ Données manquantes : clientId, cart ou orderId")
    }

    const lines = buildInvoiceLines(cart)
    const invoiceId = await createAndValidateInvoice(clientId, orderId, lines)

    return {
      statusCode: 200,
      body: JSON.stringify({ invoiceId })
    }

  } catch (error) {
    console.error("❌ Erreur handler:", error.message || error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// 🧮 Construction des lignes de facture
function buildInvoiceLines(cart) {
  return cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 19
  }))
}

// 🧾 Création et validation de facture
async function createAndValidateInvoice(clientId, orderId, lines) {
  console.log("📤 Envoi à Dolibarr : /invoices", { clientId, orderId, lines })

  let factureRes;
  try {
    factureRes = await axios.post(`${API_BASE}/invoices`, {
      socid: parseInt(clientId),
      lines,
      source: 'commande',
      fk_source: orderId,
      status: 0
    }, { headers })
  } catch (err) {
    console.error("❌ Erreur création facture:", err.response?.data || err.message)
    throw err
  }

  console.log("📨 Réponse Dolibarr:", factureRes.status, factureRes.data)

  const invoiceId = typeof factureRes.data === 'object' ? factureRes.data.id : factureRes.data
  if (!invoiceId) {
    throw new Error("❌ Impossible d'extraire l'ID de facture")
  }

  // Validation
  try {
    const validation = await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers })
    console.log("✅ Facture validée :", validation.status)
  } catch (err) {
    console.error("❌ Erreur validation:", err.response?.data || err.message)
    throw new Error("❌ La validation de la facture a échoué")
  }

  return invoiceId
}
