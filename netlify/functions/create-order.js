
const axios = require('axios')
const nodemailer = require('nodemailer')

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
    const { customer, cart, orderId } = data
    if (!customer || !cart || !orderId) {
      throw new Error("❌ Données manquantes : customer, cart ou orderId")
    }

    const customerEmail = customer.email
    if (!customerEmail) {
      throw new Error("❌ Email client manquant")
    }

    console.info("🔍 Étape 1 : recherche ou création du client via proxy...")

    const proxyUrl = "https://resplendent-centaur-abf462.netlify.app/.netlify/functions/proxy-create-order"
    const clientRes = await axios.post(proxyUrl, { customer })

    if (!clientRes.data || !clientRes.data.id) {
      throw new Error("❌ Impossible d'obtenir un ID client depuis le proxy")
    }

    const clientId = clientRes.data.id

    if (!clientId || !Array.isArray(cart) || !orderId || !customerEmail) {
      throw new Error("❌ Données manquantes : clientId, cart, orderId ou customerEmail")
    }

    const lines = buildInvoiceLines(cart)
    const { invoiceId, invoiceRef } = await createAndValidateInvoice(clientId, orderId, lines)

    const pdfUrl = `https://resplendent-centaur-abf462.netlify.app/.netlify/functions/get-invoice-pdf?id=${invoiceId}`
    await sendInvoiceEmail(customerEmail, invoiceRef, pdfUrl)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        invoiceId,
        ref: invoiceRef,
        pdfUrl
      })
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
  const factureRes = await axios.post(`${API_BASE}/invoices`, {
    socid: parseInt(clientId),
    lines,
    source: 'commande',
    fk_source: orderId,
    status: 0
  }, { headers })

  const raw = factureRes.data
  const invoiceId = typeof raw === 'object' ? raw.id : raw
  if (!invoiceId) {
    throw new Error("❌ Impossible d'extraire l'ID de facture")
  }

  await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers })

  const finalInvoice = await axios.get(`${API_BASE}/invoices/${invoiceId}`, { headers })
  const ref = finalInvoice.data?.ref || `FACT-${invoiceId}`

  return { invoiceId, invoiceRef: ref }
}
