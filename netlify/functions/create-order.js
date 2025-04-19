const axios = require("axios");
const zlib = require("zlib");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  try {
    console.log("🔁 TEST CRÉATION FACTURE BRUTE");

    const response = await axios.post(`${DOLIBARR_API}/invoices`, {
      socid: 3,
      date: new Date().toISOString().split("T")[0],
      lines: [{
        desc: "Test produit",
        fk_product: 1,
        qty: 1,
        subprice: 100,
        tva_tx: 19,
        product_type: 0
      }],
      note_public: "Test via version ultra-light"
    }, {
      headers,
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data);
    const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
    const raw = isGzip ? zlib.gunzipSync(buffer).toString() : buffer.toString();

    console.log("📦 Réponse Dolibarr brute:");
    console.log(raw);

    return {
      statusCode: 200,
      body: JSON.stringify({ result: raw.slice(0, 300) + "..." })
    };
  } catch (err) {
    console.error("💥 CRASH :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};