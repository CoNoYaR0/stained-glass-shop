
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const DOLI_API = 'https://7ssab.stainedglass.tn/api/index.php/products';
const DOLI_CARD_BASE = 'https://7ssab.stainedglass.tn/product/card.php?ref=';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 heures

const imageCache = new Map(); // ref -> { images: [...], lastUpdated: timestamp }

async function scrapeImages(ref) {
  const url = DOLI_CARD_BASE + encodeURIComponent(ref);
  try {
    const html = await fetch(url).then(res => res.text());
    const $ = cheerio.load(html);
    const links = [];

    $('a[href*="document.php?hashp="]').each((_, el) => {
      const href = $(el).attr('href');
      links.push('https://7ssab.stainedglass.tn/' + href);
    });

    return links;
  } catch (err) {
    console.warn(`❌ Erreur scraping ${ref}:`, err.message);
    return [];
  }
}

async function getImages(ref) {
  const cached = imageCache.get(ref);
  const now = Date.now();

  if (cached && now - cached.lastUpdated < CACHE_TTL) {
    return cached.images;
  }

  const images = await scrapeImages(ref);
  imageCache.set(ref, { images, lastUpdated: now });
  return images;
}

app.get('/products', async (req, res) => {
  try {
    const response = await fetch(DOLI_API, {
      headers: { 'DOLAPIKEY': process.env.DOLIBARR_API_KEY }
    });

    const data = await response.json();
    const filtered = data.filter(p => parseFloat(p.stock_reel) > 0);

    const enriched = await Promise.all(filtered.map(async p => {
      const images = await getImages(p.ref || '');
      return { ...p, images };
    }));

    res.json(enriched);
  } catch (err) {
    console.error("❌ Erreur globale /products :", err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy avec enrichissement produit + cache d'images lancé sur port ${PORT}`);
});
