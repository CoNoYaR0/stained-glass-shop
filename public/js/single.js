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
    const stock = product.stock_levels?.[0]?.quantity || 0;
    const price = Math.round(product.price || 0);
    const imgUrl = (product.images && product.images.length && product.images[0].cdn_url)
      ? product.images[0].cdn_url
      : FALLBACK_IMG;

    document.getElementById("main-img").src = imgUrl;
    document.getElementById("product-sku").textContent = product.sku.replace(/_/g, " ");
    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-category").textContent = product.categories.map(c => c.name).join(', ');
    document.getElementById("product-description").innerHTML = product.description;
    document.getElementById("product-price").textContent = `${price} TND`;
    document.getElementById("product-stock").textContent = stock > 0 ? `${stock} in stock` : "Out of stock";

    const addToCartBtn = document.getElementById("add-to-cart");
    addToCartBtn.disabled = stock <= 0;
    addToCartBtn.dataset.id = product.sku;
    addToCartBtn.dataset.name = product.name;
    addToCartBtn.dataset.price = price;
    addToCartBtn.dataset.image = imgUrl;

    const thumbsContainer = document.getElementById("thumbs");
    thumbsContainer.innerHTML = "";
    if (product.images && product.images.length > 1) {
      product.images.forEach(image => {
        const thumb = document.createElement("img");
        thumb.src = image.cdn_url;
        thumb.classList.add("thumbnail");
        thumb.addEventListener("click", () => {
          document.getElementById("main-img").src = image.cdn_url;
        });
        thumbsContainer.appendChild(thumb);
      });
    }

    // Dispatch a custom event to let other scripts know the product has been rendered
    const event = new Event('productRendered');
    document.dispatchEvent(event);
  };

  fetchProducts();
});
