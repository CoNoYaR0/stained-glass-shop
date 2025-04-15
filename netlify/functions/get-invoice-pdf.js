
const axios = require("axios");

exports.handler = async function (event) {
  const { id, ref, expires } = event.queryStringParameters;
  const DOLIBARR_URL = process.env.DOLIBARR_URL;
  const DOLIBARR_TOKEN = process.env.DOLIBARR_TOKEN;

  if (expires && Date.now() > parseInt(expires)) {
    return {
      statusCode: 410,
      body: JSON.stringify({ error: "Lien expiré – merci de revalider votre commande." })
    };
  }

  if (!id && !ref) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Paramètre 'id' ou 'ref' requis." })
    };
  }

  try {
    let invoiceId = id;
    if (!invoiceId && ref) {
      const searchRes = await axios.get(`${DOLIBARR_URL}/invoices?sqlfilters=t.ref='${ref}'`, {
        headers: { DOLAPIKEY: DOLIBARR_TOKEN }
      });
      if (searchRes.data.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Facture introuvable." })
        };
      }
      invoiceId = searchRes.data[0].id;
    }

    await axios.get(`${DOLIBARR_URL}/invoices/${invoiceId}/generate-pdf`, {
      headers: { DOLAPIKEY: DOLIBARR_TOKEN }
    });

    const fileRes = await axios.get(`${DOLIBARR_URL}/documents/facture/${invoiceId}/ref.pdf`, {
      headers: { DOLAPIKEY: DOLIBARR_TOKEN },
      responseType: "arraybuffer"
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${invoiceId}.pdf"`
      },
      body: fileRes.data.toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("❌ Erreur get-invoice-pdf:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de récupérer la facture PDF." })
    };
  }
};
