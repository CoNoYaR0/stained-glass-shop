const axios = require("axios");

const DOLI_API_URL = "https://7ssab.stainedglass.tn/api/index.php";
const DOLI_API_KEY = process.env.DOLIBARR_TOKEN;

exports.handler = async function (event, context) {
  try {
    const { data } = await axios.get(`${DOLI_API_URL}/products`, {
      headers: {
        DOLAPIKEY: DOLI_API_KEY,
      },
    });

    if (!Array.isArray(data)) {
      console.error("❌ Donnée inattendue depuis Dolibarr :", data);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Réponse inattendue depuis Dolibarr.",
        }),
      };
    }

    const products = data.map((p) => ({
      id: p.id,
      ref: p.ref,
      name: p.label || "Sans nom",
      price: p.price || 0,
      stock: p.stock_real ?? 0,
      image: `/.netlify/functions/proxy-image?ref=${encodeURIComponent(p.ref)}`,
      highlight: false,
    }));

    console.log("✅ Produits formatés :", products.length);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        products,
      }),
    };
  } catch (error) {
    console.error("💥 Erreur Dolibarr sync-products:", error.message || error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Erreur lors de la récupération des produits Dolibarr.",
      }),
    };
  }
};