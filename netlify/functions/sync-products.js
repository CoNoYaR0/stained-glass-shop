const axios = require("axios");

const DOLI_API_URL = "https://7ssab.stainedglass.tn/api/index.php";
const DOLI_API_KEY = process.env.DOLI_API_KEY;

const getImageUrl = (productName) => {
  if (!productName) return "/images/products/default.png";
  const cleanName = encodeURIComponent(productName.trim().replace(/\s+/g, "_"));
  return `https://7ssab.stainedglass.tn/document.php?modulepart=produit&entity=1&file=${cleanName}%2F${cleanName}-showcase-1.png`;
};

exports.handler = async function (event, context) {
  try {
    const response = await axios.get(`${DOLI_API_URL}/products`, {
      headers: {
        DOLAPIKEY: DOLI_API_KEY,
      },
    });

    const products = response.data.map((p) => ({
      id: p.id,
      name: p.label,
      price: p.price || 0,
      stock: p.stock_real ?? 0,
      image: getImageUrl(p.label),
      highlight: false,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, products }),
    };
  } catch (error) {
    console.error("Erreur Dolibarr sync-products:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Erreur lors de la récupération des produits Dolibarr." }),
    };
  }
};
