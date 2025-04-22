require("dotenv").config();
console.log("➡️ Script lancé !");

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DOLI_API_URL = "https://7ssab.stainedglass.tn/api/index.php";
const DOLI_API_KEY = process.env.DOLIBARR_TOKEN;

async function main() {
  try {
    const response = await axios.get(`${DOLI_API_URL}/products`, {
      headers: {
        DOLAPIKEY: DOLI_API_KEY,
      },
    });

    const rawProducts = response.data;
    console.log(`📦 Produits récupérés : ${rawProducts.length}`);

    const products = rawProducts.map((p) => ({
      ref: p.ref,
      name: p.label || "Sans nom",
      price: p.price || 0,
      stock: p.stock_real ?? 0,
    }));

    const outputPath = path.join(__dirname, "../../static/products.json");
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    console.log(`✅ products.json créé à : ${outputPath}`);

    const baseDir = path.join(__dirname, "../../static/images/products/");
    products.forEach((p) => {
      const dir = path.join(baseDir, p.ref);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé pour : ${p.ref}`);
      }
    });

    console.log("✅ Sync terminé.");
  } catch (err) {
    console.error("💥 Erreur durant le sync :", err.message || err);
  }
}

main();
