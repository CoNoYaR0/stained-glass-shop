
const axios = require('axios');
const nodemailer = require('nodemailer');

const API_BASE = process.env.DOLIBARR_URL;
const TOKEN = process.env.DOLIBARR_TOKEN;
const headers = {
  'DOLAPIKEY': TOKEN,
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { customer, cart, totalTTC } = data;

    if (!customer?.email || !cart?.length) {
      throw new Error("❌ Données client/cart manquantes");
    }

    const clientId = await findOrCreateClientDolibarr(customer);
    const orderId = await createOrderDolibarr(clientId, cart);
    const { invoiceId, invoiceRef } = await createAndValidateInvoice(clientId, orderId, cart);

    const pdfUrl = `https://resplendent-centaur-abf462.netlify.app/.netlify/functions/get-invoice-pdf?id=${invoiceId}`;

    await sendInvoiceEmail(customer.email, invoiceRef, pdfUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        facture: {
          invoiceId,
          ref: invoiceRef,
          pdfUrl
        }
      })
    };
  } catch (err) {
    console.error("❌ Erreur create-order:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

async function findOrCreateClientDolibarr(customer) {
  const { email, nom, prenom, tel, adresse } = customer;

  const search = await axios.get(`${API_BASE}/thirdparties?sqlfilters=(email:=:'${email}')`, { headers });
  if (Array.isArray(search.data) && search.data.length > 0) {
    return search.data[0].id;
  }

  const clientRes = await axios.post(`${API_BASE}/thirdparties`, {
    name: `${prenom} ${nom}`,
    email,
    phone: tel,
    address: adresse,
    client: 1,
    status: 1
  }, { headers });

  return clientRes.data;
}

async function createOrderDolibarr(clientId, cart) {
  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 19
  }));

  const res = await axios.post(`${API_BASE}/orders`, {
    socid: clientId,
    lines,
    status: 0
  }, { headers });

  return res.data;
}

async function createAndValidateInvoice(clientId, orderId, cart) {
  const lines = cart.map(p => ({
    product_id: p.id,
    qty: p.qty,
    subprice: p.price_ht,
    tva_tx: p.tva || 19
  }));

  const factureRes = await axios.post(`${API_BASE}/invoices`, {
    socid: clientId,
    lines,
    source: 'commande',
    fk_source: orderId,
    status: 0
  }, { headers });

  const invoiceId = typeof factureRes.data === 'object' ? factureRes.data.id : factureRes.data;

  if (!invoiceId) throw new Error("❌ Impossible de récupérer l'ID de la facture");

  await axios.post(`${API_BASE}/invoices/${invoiceId}/validate`, {}, { headers });

  const finalInvoice = await axios.get(`${API_BASE}/invoices/${invoiceId}`, { headers });
  const ref = finalInvoice.data?.ref || `FACT-${invoiceId}`;

  return { invoiceId, invoiceRef: ref };
}

async function sendInvoiceEmail(email, ref, pdfUrl) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ovh.net',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>🧾 Votre facture ${ref}</h2>
      <p>Bonjour,</p>
      <p>Merci pour votre commande. Vous pouvez télécharger votre facture en cliquant sur le bouton ci-dessous :</p>
      <a href="${pdfUrl}" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;" target="_blank">
        📄 Télécharger votre facture
      </a>
      <p style="margin-top:20px;">— L'équipe StainedGlass</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: 'StainedGlass <commande@stainedglass.tn>',
    to: email,
    subject: `Votre facture ${ref}`,
    html: htmlContent
  });

  console.log("✉️ Email envoyé:", info.messageId);
}
