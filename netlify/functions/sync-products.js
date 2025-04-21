const axios = require("axios");

exports.handler = async function(event, context) {
  const DOLIBARR_API = "https://7ssab.stainedglass.tn/api/index.php";
  const API_KEY = process.env.DOLIBARR_TOKEN;

  try {
    const response = await axios.get(`${DOLIBARR_API}/products`, {
      headers: { DOLAPIKEY: API_KEY }
    });

    // Filtre uniquement les produits actifs (status = 1)
    const products = response.data
      .filter(prod => prod.status === "1")
      .map(prod => ({
        id: prod.id,
        name: prod.label,
        price: parseFloat(prod.price),
        stock: parseInt(prod.stock_reel, 10),
        image: prod.images && prod.images.length ? prod.images[0].url : "/images/products/default.png",
        description: prod.description || "Aucune description disponible.",
        highlight: false // par défaut, modifiable manuellement ensuite
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, products })
    };

  } catch (error) {
    console.error("❌ Erreur de synchronisation :", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
