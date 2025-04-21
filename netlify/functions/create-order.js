const axios = require("axios");

const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
const API_KEY = process.env.DOLIBARR_TOKEN;

const headers = {
  DOLAPIKEY: API_KEY,
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  try {
    console.log("🔁 TEST FACTURE STRUCTURÉE");

    const response = await axios.post(`${DOLIBARR_API}/invoices`, {
      socid: 3,
      date: new Date().toISOString().split("T")[0],
      lines: [{
        desc: "Produit test",
        label: "Produit test",
        fk_product: 1,
        qty: 1,
        subprice: 100,
        tva_tx: 19,
        product_type: 0,
        remise_percent: 0,
        localtax1_tx: 0,
        localtax2_tx: 0,
        fk_unit: 1,
        fk_code_ventilation: 0,
        pa_ht: 0,
        date_start: null,
        date_end: null,
        special_code: 0,
        info_bits: 0,
        fk_remise_except: 0,
        fk_fournprice: 0,
        fk_prev_id: 0,
        array_options: {},
        rang: 1,
        situation_percent: 100,
        multicurrency_subprice: 100
      }],
      note_public: "Facture générée via test structuré"
    }, {
      headers: { ...headers, "Accept-Encoding": "identity" },
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data);
    const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
    const raw = isGzip ? require("zlib").gunzipSync(buffer).toString() : buffer.toString();

    console.log("📦 Réponse brute :");
    console.log(raw.slice(0, 500));

    return {
      statusCode: 200,
      body: JSON.stringify({ preview: raw.slice(0, 300) + "..." })
    };
  } catch (err) {
    console.error("💥 CRASH :", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};