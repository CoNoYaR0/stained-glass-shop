const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DOLI_API_URL = 'https://7ssab.stainedglass.tn/api/index.php';
const DOLI_API_KEY = process.env.DOLIBARR_TOKEN;

const getImageUrl = async (ref) => {
  const encodedRef = encodeURIComponent(ref.trim().replace(/\s+/g, '_'));
  const imageUrl = `https://7ssab.stainedglass.tn/document.php?modulepart=product&entity=1&file=${encodedRef}%2F${encodedRef}-showcase-1.png`;
  const localImagePath = path.join(__dirname, '..', '..', 'static', 'images', 'products', `${encodedRef}-showcase-1.png`);

  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(localImagePath);
    response.data.pipe(writer);
    return `/images/products/${encodedRef}-showcase-1.png`;
  } catch (error) {
    console.error(`Erreur lors du téléchargement de l'image pour ${ref}:`, error.message);
    return '/images/products/default.png';
  }
};

exports.handler = async function (event, context) {
  try {
    const { data } = await axios.get(`${DOLI_API_URL}/products`, {
      headers: {
        DOLAPIKEY: DOLI_API_KEY,
      },
    });

    if (!Array.isArray(data)) {
      console.error('❌ Donnée inattendue depuis Dolibarr :', data);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Réponse inattendue depuis Dolibarr.',
        }),
      };
    }

    const products = await Promise.all(
      data.map(async (p) => ({
        id: p.id,
        name: p.label || 'Sans nom',
        price: p.price || 0,
        stock: p.stock_real ?? 0,
        image: await getImageUrl(p.ref),
        highlight: false,
      }))
    );

    console.log('✅ Produits formatés :', products.length);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        products,
      }),
    };
  } catch (error) {
    console.error('💥 Erreur Dolibarr sync-products:', error.message || error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de la récupération des produits Dolibarr.',
      }),
    };
  }
};
