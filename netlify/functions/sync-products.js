const axios = require("axios"); // <-- Import FONDAMENTAL

const DOLI_API_URL = "https://7ssab.stainedglass.tn/api/index.php";
const DOLI_API_KEY = process.env.DOLIBARR_TOKEN;

const getImageUrl = (productName) => {
  if (!productName || typeof productName !== "string") {
    return "/images/products/default.png";
  }

  const encoded = encodeURIComponent(productName.trim().replace(/\s+/g, "_"));
  return `https://7ssab.stainedglass.tn/document.php?modulepart=product&entity=1&file=${encoded}%2F${encoded}-showcase-1.png`;
};

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
      name: p.label || "Sans nom",
      price: p.price || 0,
      stock: p.stock_real ?? 0,
      image: getImageUrl(p.label),
      highlight: false,
    }));

    console.log("✅ Produits chargés :", products.length);

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
