
const axios = require("axios")

const DOLIBARR_URL = process.env.DOLIBARR_URL
const DOLIBARR_TOKEN = process.env.DOLIBARR_TOKEN

exports.handler = async (event) => {
  try {
    const invoiceId = event.queryStringParameters?.id
    if (!invoiceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "ID facture manquant." })
      }
    }

    // 1️⃣ Générer le PDF (si pas encore généré)
    await axios.get(`${DOLIBARR_URL}/invoices/${invoiceId}/generate-pdf`, {
      headers: { DOLAPIKEY: DOLIBARR_TOKEN }
    })

    // 2️⃣ Récupérer la ref officielle de la facture
    const invoiceInfo = await axios.get(`${DOLIBARR_URL}/invoices/${invoiceId}`, {
      headers: { DOLAPIKEY: DOLIBARR_TOKEN }
    });
    const ref = invoiceInfo.data.ref;

    // 3️⃣ Télécharger le fichier PDF réel
    const fileRes = await axios.get(`${DOLIBARR_URL}/documents/facture/${invoiceId}/${ref}.pdf`, {
      headers: { DOLAPIKEY: DOLIBARR_TOKEN },
      responseType: "arraybuffer"
    })

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=${ref}.pdf`
      },
      body: fileRes.data.toString("base64"),
      isBase64Encoded: true
    }
  } catch (err) {
    console.error("❌ Erreur get-invoice-pdf:", err.response?.data || err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de récupérer la facture PDF." })
    }
  }
}
