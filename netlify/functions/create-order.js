// Netlify Function: create-order.js
const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Env vars
const API_BASE = process.env.DOLIBARR_URL
const TOKEN = process.env.DOLIBARR_TOKEN
const SECRET = process.env.ORDER_SECRET

const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  try {
    // 🔐 Vérif clé secrète (appel autorisé uniquement via webhook)
    if (event.headers['x-secret-key'] !== SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Accès non autorisé' })
      }
    }

    const data = JSON.parse(event.body)
    const { cart, customer, totalTTC } = data
    let totalCalc = 0

    // 🔁 Vérif stock + Recalcul TTC
    for (const item of cart) {
      const qty = parseFloat(item.qty)
      const price_ht = parseFloat(item.price_ht)

      const productRes = await axios.get(`${API_BASE}/products/${item.id}`, { headers })
      const product = productRes.data

      const stock = parseFloat(product.stock_real)
      if (stock < qty) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Stock insuffisant pour "${product.label}". Dispo : ${stock}, demandé : ${qty}`
          })
        }
      }

      const tva = parseFloat(product.tva_tx || 20)
      totalCalc += qty * price_ht * (1 + tva / 100)
    }

    const totalArrondi = Math.round(totalCalc * 100) / 100
    const totalEnvoye = Math.round(parseFloat(totalTTC) * 100) / 100

    if (totalArrondi !== totalEnvoye) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Total incohérent. Calculé : ${totalArrondi} €, reçu : ${totalEnvoye} €`
        })
      }
    }

    // 🔧 Création client, commande, facture
    const clientId = await findOrCreateClient(customer)
    const order = await createOrder(clientId, cart)
    const invoice = await createInvoice(clientId, cart, order.id)
    const pdfUrl = `/.netlify/functions/get-invoice-pdf?id=${invoice.id}`
    await generatePDF(invoice.id)

    // 📬 Envoi email avec le PDF
    await sendInvoiceEmail(customer.email, invoice.ref, pdfUrl)

    // 🧠 Log JSON dans /tmp
    const log = {
      date: new Date().toISOString(),
      client: customer.email,
      commande: { id: order.id, ref: order.ref },
      facture: { id: invoice.id, ref: invoice.ref },
      total: totalTTC
    }
    const logPath = path.join('/tmp', `log-${Date.now()}.json`)
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2))

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        commande: { id: order.id, ref: order.ref },
        facture: { id: invoice.id, ref: invoice.ref, pdfUrl }
      })
    }

  } catch (error) {
    console.error('Erreur create-order:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la création de commande' })
    }
  }
}

// 🔎 Trouver ou créer un client
async function findOrCreateClient(customer) {
  const { email, nom, adresse, ville, pays } = customer
  const res = await axios.get(`${API_BASE}/thirdparties?sqlfilters=t.email='${email}'`, { headers })
  if (res.data && res.data.length > 0) return res.data[0].id

  const createRes = await axios.post(`${API_BASE}/thirdparties`, {
    name: nom,
    email,
    address: adresse,
    town: ville,
    country: pays || 'FR',
    client: 1
  }, { headers })
  return createRes.data
}

// 📦 Créer une commande client
async function createOrder(clientId, cart) {
  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 20
  }))
  const res = await axios.post(`${API_BASE}/orders`, {
    socid: clientId,
    lines
  }, { headers })
  return res.data
}

// 🧾 Créer une facture
async function createInvoice(clientId, cart, orderId) {
  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 20
  }))
  const res = await axios.post(`${API_BASE}/invoices`, {
    socid: clientId,
    lines,
    source: 'commande',
    fk_source: orderId,
    status: 1
  }, { headers })
  return res.data
}

// 📄 Générer PDF
async function generatePDF(invoiceId) {
  await axios.get(`${API_BASE}/invoices/${invoiceId}/generate-pdf`, { headers })
}

// 📬 Envoi d'email (exemple à adapter selon le service utilisé)
async function sendInvoiceEmail(email, ref, pdfUrl) {
  console.log(`✉️ Envoi de la facture ${ref} à ${email} avec le lien : ${pdfUrl}`)
  // TODO : remplacer ce console.log par un appel à Resend, SendGrid, etc.
}
