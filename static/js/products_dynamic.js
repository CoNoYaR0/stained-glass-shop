document.addEventListener("DOMContentLoaded", () => {
  const API_URL      = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const CDN_BASE_URL = "https://cdn.stainedglass.tn"; 
  const FALLBACK_IMG = `${CDN_BASE_URL}/images/fallback.jpg`;
  const productGrid  = document.getElementById("product-grid");

  if (!productGrid) {
    console.error("❌ productGrid not found in DOM");
    return;
  }

  const fetchProducts = async () => {
    console.log("📡 Fetching products from API:", API_URL);
    try {
      const res    = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();    
      const raw    = Array.isArray(result.data) ? result.data : [];
      console.log("✅ API returned data array:", raw);

      if (!raw.length) {
        console.warn("⚠️ No products found in API response.");
        productGrid.innerHTML = "<p>No products available.</p>";
        return;
      }

      // On transforme chaque élément "plat" en product avec une variant unique
      const products = raw.map(item => ({
        id:       item.dolibarr_product_id || item.id,
        name:     item.name,
        category: item.category || "Uncategorized",
        variants: [{
          sku:    item.sku,
          price:  item.price || item.purchase_price_ht || 0,
          stock:  item.stock || item.quantity || 0,
          images: Array.isArray(item.images) ? item.images : []
        }]
      }));

      renderProducts(products);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      productGrid.innerHTML = "<p>Failed to load products. Please try again later.</p>";
    }
  };

  const renderProducts = (products) => {
    console.log("🖌 Rendering products...");
    productGrid.innerHTML = "";

    products.forEach(product => {
      const v0 = product.variants[0];

      // Détermine l'URL de l'image : première image ou fallback
      let imgUrl = v0.images.length && v0.images[0].url
        ? v0.images[0].url
        : FALLBACK_IMG;

      // Si c'est un chemin relatif ("/uploads/..."), on le sert depuis le CDN
      if (imgUrl.startsWith("/")) {
        imgUrl = `${CDN_BASE_URL}${imgUrl}`;
      }

      // Nettoyage du SKU et arrondi du prix
      const cleanSKU     = v0.sku.replace(/_/g, " ");
      const roundedPrice = Math.round(v0.price);
      const stockCount   = v0.stock;

      const cardHTML = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="block product-card">
            <div class="image-container">
              <img class="img-fluid" src="${imgUrl}" alt="${product.name}">
              <div class="overlay">
                <button class="add-to-cart translucent-btn"
                  data-id="${v0.sku}"
                  data-name="${product.name}"
                  data-price="${v0.price}"
                  data-image="${imgUrl}"
                  ${stockCount <= 0 ? "disabled" : ""}>
                  ${stockCount <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div class="product-info">
              <h4 class="mb-2 link-title">${cleanSKU}</h4>
              <p class="name">${product.name}</p>
              <p class="category">${product.category}</p>
              <p class="stock">${stockCount} in stock</p>
              <p class="price">${roundedPrice} TND</p>
            </div>
          </div>
        </div>
      `;
      productGrid.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Ré-attachement des listeners Add to Cart
    if (window.attachAddToCartButtons) {
      console.log("🔗 Attaching Add to Cart buttons…");
      window.attachAddToCartButtons();
    }
  };

  fetchProducts();
});
