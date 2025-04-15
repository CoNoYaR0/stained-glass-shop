
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const API_BASE = process.env.DOLIBARR_URL
const TOKEN = process.env.DOLIBARR_TOKEN
const SECRET = process.env.ORDER_SECRET

const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  try {
    const secretKey = event.headers['x-secret-key']
    if (secretKey !== SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Accès non autorisé' })
      }
    }

    const data = JSON.parse(event.body)
    const { cart, customer, totalTTC } = data
    let totalCalc = 0

    for (const item of cart) {
      if (!item.id || typeof item.id !== 'number') {
        throw new Error(`❌ Produit sans identifiant valide (${item.title || 'Inconnu'})`)
      }

      const productRes = await axios.get(`${API_BASE}/products/${item.id}`, { headers })
      const product = productRes.data
      const stock = parseFloat(product.stock_real)
      if (stock < item.qty) {
        throw new Error(`❌ Stock insuffisant pour ${product.label}. Dispo: ${stock}, demandé: ${item.qty}`)
      }

      const tva = parseFloat(product.tva_tx || 19)
      totalCalc += item.qty * item.price_ht * (1 + tva / 100)
    }

    const totalArrondi = Math.round(totalCalc * 100) / 100
    const totalEnvoye = Math.round(parseFloat(totalTTC) * 100) / 100
    if (totalArrondi !== totalEnvoye) {
      throw new Error(`❌ Total incohérent. Calculé : ${totalArrondi} €, reçu : ${totalEnvoye} €`)
    }

    const clientId = await findOrCreateClient(customer)
    const order = await createOrder(clientId, cart)
    const invoice = await createInvoice(clientId, cart, order.id)

    const invoiceId = invoice?.id
    if (!invoiceId) {
      throw new Error('❌ Impossible de générer la facture : ID introuvable')
    }

    await generatePDF(invoiceId)

    const pdfUrl = `/.netlify/functions/get-invoice-pdf?id=${invoiceId}`
    await sendInvoiceEmail(customer.email, invoice.ref, pdfUrl)

    updateViewsStats(cart)
    logOrderData(customer.email, order, invoice, totalTTC)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        commande: { id: order.id, ref: order.ref },
        facture: { id: invoice.id, ref: invoice.ref, pdfUrl }
      })
    }
  } catch (error) {
    console.error('❌ Erreur create-order:', error.message || error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Erreur lors de la création de commande' })
    }
  }
}

async function findOrCreateClient(customer) {
  const { email, nom, adresse, ville, pays } = customer
  const res = await axios.get(`${API_BASE}/thirdparties?sqlfilters=(t.email:=:'${email}')`, { headers })
  if (res.data && res.data.length > 0) return res.data[0].id

  const createRes = await axios.post(`${API_BASE}/thirdparties`, {
    name: nom,
    email,
    address: adresse,
    town: ville,
    country: pays || 'FR',
    client: 1
  }, { headers })
  return createRes.data.id
}

async function createOrder(clientId, cart) {
  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 19
  }));

  const res = await axios.post(`${API_BASE}/orders`, {
    socid: parseInt(clientId),
    date: new Date().toISOString().split('T')[0],
    lines
  }, { headers });

  const raw = res.data;
  if (typeof raw === 'number') return { id: raw, ref: `Commande ${raw}` };

  const id = raw?.id || raw?.element?.id;
  const ref = raw?.ref || raw?.element?.ref;
  return { id, ref };
}

async function createInvoice(clientId, cart, orderId) {
  if (!orderId) throw new Error('❌ ID de commande manquant pour création de facture')

  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 19
  }))

  const createRes = await axios.post(`${API_BASE}/invoices`, {
    socid: parseInt(clientId),
    lines,
    source: 'commande',
    fk_source: orderId,
    status: 0
  }, { headers })

  console.log("🧾 DEBUG facture (raw response):", createRes.data)

  const invoiceId = createRes.data.id
  if (!invoiceId) {
    throw new Error('❌ Impossible de récupérer l’ID de la facture créée')
  }

  await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers })
  return { id: invoiceId, ref: createRes.data.ref }
}

async function generatePDF(invoiceId) {
  if (!invoiceId) throw new Error('❌ ID facture manquant pour génération PDF')
  const url = `${API_BASE}/invoices/${invoiceId}/generate-pdf`
  return await axios.get(url, { headers })
}

async function sendInvoiceEmail(email, ref, pdfUrl) {
  console.log(`✉️ Envoi de la facture ${ref} à ${email} avec le lien : ${pdfUrl}`)
}

function updateViewsStats(cart) {
  const viewsPath = path.resolve('./data/views.json')
  let vuesData = {}
  if (fs.existsSync(viewsPath)) {
    vuesData = JSON.parse(fs.readFileSync(viewsPath))
  }
  cart.forEach(p => {
    if (!vuesData[p.id]) vuesData[p.id] = { views: 0, commandes: 0 }
    vuesData[p.id].commandes += 1
  })
  fs.writeFileSync(viewsPath, JSON.stringify(vuesData, null, 2))
}

function logOrderData(email, order, invoice, total) {
  const log = {
    date: new Date().toISOString(),
    client: email,
    commande: { id: order.id, ref: order.ref },
    facture: { id: invoice.id, ref: invoice.ref },
    total
  }
  const logPath = path.join('/tmp', `log-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
}
