document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE     = 'https://dolibarr-middleware.onrender.com';
  const CDN_BASE     = 'https://cdn.stainedglass.tn';
  const FALLBACK_IMG = `${CDN_BASE}/images/fallback.jpg`;
  const HEALTH_URL   = `${API_BASE}/health`;

  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  const messageEl = document.getElementById('message');
  if (!slug) {
    messageEl.textContent = 'No product specified.';
    return;
  }

  // Keep-alive ping
  (async function keepAlive() {
    try { await fetch(HEALTH_URL); } catch (e) {}
    setTimeout(keepAlive, 10 * 60 * 1000);
  })();

  try {
    const resp = await fetch(`${API_BASE}/api/v1/products/${encodeURIComponent(slug)}`);
    if (!resp.ok) throw new Error('Product not found');
    const product = await resp.json();
    initProductPage(product);
  } catch (err) {
    messageEl.textContent = err.message;
  }

  function initProductPage(product) {
    document.getElementById('title').textContent = product.name;

    // Story sections
    const storyEl = document.getElementById('story');
    const desc = product.description || '';
    desc.split(/\.\s+/).filter(s => s.trim()).forEach((sentence, i) => {
      const sec = document.createElement('div'); sec.className = 'story-section';
      const h2 = document.createElement('h2'); h2.textContent = `Part ${i+1}`;
      const p  = document.createElement('p'); p.textContent = sentence.trim().replace(/\.$/, '') + '.';
      sec.append(h2, p);
      storyEl.appendChild(sec);
    });

    // Variants
    const variants = Array.isArray(product.variants) && product.variants.length
      ? product.variants
      : [{
          sku: product.slug,
          price: product.price,
          stock: product.stock_levels?.[0]?.quantity || 0,
          images: product.images || []
        }];

    const heroEl     = document.getElementById('hero');
    const priceEl    = document.getElementById('price');
    const stockEl    = document.getElementById('stock');
    const variantsEl = document.getElementById('variants');
    const addBtn     = document.getElementById('add-to-cart');

    let selectedIndex = 0;
    function renderVariant(idx) {
      const v = variants[idx];
      // Hero image
      const imgUrl = Array.isArray(v.images) && v.images.length
        ? (v.images[0].cdn_url || v.images[0].url || v.images[0])
        : FALLBACK_IMG;
      heroEl.style.backgroundImage = `url('${imgUrl}')`;

      // Price & stock
      priceEl.textContent = `$${parseFloat(v.price).toFixed(2)}`;
      stockEl.textContent = `${v.stock} in stock`;

      // Button data
      addBtn.dataset.sku   = v.sku;
      addBtn.dataset.price = v.price;
      addBtn.disabled      = v.stock <= 0;
    }

    // Build variant selectors
    if (variants.length > 1) {
      variantsEl.innerHTML = '';
      if (variants[0].attributeType === 'Color') {
        variants.forEach((v, i) => {
          const btn = document.createElement('button');
          btn.className = 'swatch';
          btn.title = v.attributeValue;
          btn.style.backgroundColor = v.attributeValue;
          btn.disabled = v.stock <= 0;
          btn.dataset.index = i;
          btn.addEventListener('click', () => { selectedIndex = i; renderVariant(i); });
          variantsEl.appendChild(btn);
        });
      } else {
        const sel = document.createElement('select');
        variants.forEach((v, i) => {
          const opt = document.createElement('option');
          opt.value = i;
          opt.text  = `${v.attributeValue}${v.stock <= 0 ? ' (Out)' : ''}`;
          opt.disabled = v.stock <= 0;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', e => { selectedIndex = +e.target.value; renderVariant(selectedIndex); });
        variantsEl.appendChild(sel);
      }
    }

    // Initial render
    renderVariant(0);

    // Cart integration
    if (window.attachAddToCartButtons) window.attachAddToCartButtons();
  }
});
