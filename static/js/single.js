document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const CDN_BASE_URL = "https://cdn.stainedglass.tn";
  const FALLBACK_IMG = `${CDN_BASE_URL}/images/fallback.jpg`;
  const HEALTH_URL = "https://dolibarr-middleware.onrender.com/health";
  const productContainer = document.getElementById("product-container");

  if (!productContainer) {
    console.error("❌ productContainer not found in DOM");
    return;
  }

  // ─── Keep-alive ping ──────────────────────────────────────────────────────────
  function keepAlive() {
    fetch(HEALTH_URL).catch(() => {});
  }
  keepAlive();
  setInterval(keepAlive, 10 * 60 * 1000);

  const getSkuFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sku');
  };

  // ─── Fetch & group products ──────────────────────────────────────────────────
  const fetchProducts = async () => {
    console.log("📡 Fetching products from API:", API_URL);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const raw = Array.isArray(result.data) ? result.data : [];
      console.log("✅ API returned data array:", raw);

      if (!raw.length) {
        productContainer.innerHTML = "<p>No products available.</p>";
        return;
      }

      const sku = getSkuFromUrl();
      const product = raw.find(p => p.sku === sku);

      if (!product) {
        productContainer.innerHTML = "<p>Product not found.</p>";
        return;
      }

      renderProduct(product);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      productContainer.innerHTML = "<p>Failed to load product. Please try again later.</p>";
    }
  };

  // ─── Render product ──────────────────────────────────────────────────────────
  const renderProduct = (product) => {
    productContainer.innerHTML = "";

    const imgUrl = (product.images && product.images.length && product.images[0].cdn_url)
      ? product.images[0].cdn_url
      : FALLBACK_IMG;

    const stock = product.stock_levels?.[0]?.quantity || 0;
    const price = Math.round(product.price || 0);

    const productHTML = `
      <div class="product-single-container">
          <div id="loading">Loading...</div>
          <div id="error" style="display: none; color: red;"></div>
          <div id="product-details" class="product-container" style="display: none;">
              <div class="product-image-gallery">
                  <img id="main-image" src="${imgUrl}" alt="Product Image" class="product-single-image">
                  <div id="thumbnail-gallery" class="thumbnail-gallery"></div>
              </div>
              <div class="product-info">
                  <h1 id="product-title">${product.name}</h1>
                  <h2 id="product-subtitle">${product.sku}</h2>
                  <p id="product-category">${product.categories.map(c => c.name).join(', ')}</p>
                  <div id="product-description">${product.description}</div>
                  <p id="product-price" class="product-price">${price} TND</p>
                  <p id="product-stock" class="product-stock">${stock > 0 ? `${stock} in stock` : 'Out of stock'}</p>
                  <button id="add-to-cart-btn" class="add-to-cart-btn" ${stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
              </div>
          </div>
      </div>
    `;
    productContainer.innerHTML = productHTML;
    document.getElementById('product-details').style.display = 'flex';
    document.getElementById('loading').style.display = 'none';
  };

  fetchProducts();
});
