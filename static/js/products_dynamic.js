document.addEventListener("DOMContentLoaded", () => {
  const API_URL     = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const productGrid = document.getElementById("product-grid");

  if (!productGrid) {
    console.error("❌ productGrid not found in DOM");
    return;
  }

  const fetchProducts = async () => {
    console.log("📡 Fetching products from API:", API_URL);
    try {
      const res    = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();      // { data: [...], pagination: {...} }
      const raw    = Array.isArray(result.data) ? result.data : [];
      console.log("✅ API returned data array:", raw);

      if (!raw.length) {
        console.warn("⚠️ No products found in API response.");
        productGrid.innerHTML = "<p>No products available.</p>";
        return;
      }

      // Map each “flat” product en { variants: [...] }
      const products = raw.map(item => ({
        id:   item.dolibarr_product_id || item.id,
        name: item.name,
        tags: item.tags || [],               // ou [] si pas de tags
        variants: [{
          sku:   item.sku,
          price: item.price   || item.purchase_price_ht || 0,
          stock: item.stock   || item.quantity          || 0,
          images: item.images || []              // adapter si champ différent
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
      const img = v0.images.length 
        ? v0.images[0].url 
        : "https://via.placeholder.com/300";

      // Pas de selector ici puisque on n’a qu’une variante
      const card = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="block product-card">
            <div class="image-container">
              <img class="img-fluid" src="${img}" alt="${product.name}">
              <div class="overlay">
                <button class="add-to-cart translucent-btn"
                  data-id="${v0.sku}"
                  data-name="${product.name}"
                  data-price="${v0.price}"
                  data-image="${img}"
                  ${v0.stock <= 0 ? "disabled" : ""}>
                  ${v0.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div class="product-info">
              <h4 class="mb-2"><a href="#" class="link-title">${product.name}</a></h4>
              <p class="sku">SKU: ${v0.sku}</p>
              <p class="price">${v0.price} TND</p>
            </div>
          </div>
        </div>
      `;
      productGrid.insertAdjacentHTML("beforeend", card);
    });

    if (window.attachAddToCartButtons) {
      console.log("🔗 Attaching Add to Cart buttons…");
      window.attachAddToCartButtons();
    }
  };

  fetchProducts();
});
