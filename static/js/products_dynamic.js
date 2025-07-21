document.addEventListener("DOMContentLoaded", () => {
  const API_URL     = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const IMG_PREFIX  = "https://dolibarr-middleware.onrender.com"; // ajuster si besoin
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
      const result = await res.json();  // { data: [...], pagination: {...} }
      const raw    = Array.isArray(result.data) ? result.data : [];
      console.log("✅ API returned data array:", raw);

      if (!raw.length) {
        console.warn("⚠️ No products found in API response.");
        productGrid.innerHTML = "<p>No products available.</p>";
        return;
      }

      // On reformate chaque item "plat" en { variants: [...] }
      const products = raw.map(item => ({
        id:   item.dolibarr_product_id || item.id,
        name: item.name,
        category: item.category || "Uncategorized",  // champ category attendu
        tags: item.tags || [],
        variants: [{
          sku:   item.sku,
          price: item.price || item.purchase_price_ht || 0,
          stock: item.stock || item.quantity || 0,
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
    productGrid.innerHTML = ""; // on vide

    products.forEach(product => {
      const v0 = product.variants[0];
      // Si l’URL commence par /api, on la préfixe
      let imgUrl = v0.images.length && v0.images[0].url
        ? v0.images[0].url
        : "/images/placeholder.png";
      if (imgUrl.startsWith("/")) imgUrl = IMG_PREFIX + imgUrl;

      // Nettoyage du SKU pour l’affichage titre
      const cleanSKU = v0.sku.replace(/_/g, " ");

      // Arrondi du prix
      const roundedPrice = Math.round(v0.price);

      const card = `
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
                  ${v0.stock <= 0 ? "disabled" : ""}>
                  ${v0.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div class="product-info">
              <!-- SKU en titre, underscores convertis -->
              <h4 class="mb-2 link-title">${cleanSKU}</h4>
              <!-- Affichage du nom en dessous -->
              <p class="name">Name: ${product.name}</p>
              <!-- Affichage de la catégorie -->
              <p class="category">Category: ${product.category}</p>
              <!-- Prix arrondi -->
              <p class="price">${roundedPrice} TND</p>
            </div>
          </div>
        </div>
      `;
      productGrid.insertAdjacentHTML("beforeend", card);
    });

    // On ré-attache les boutons Add to Cart
    if (window.attachAddToCartButtons) {
      console.log("🔗 Attaching Add to Cart buttons…");
      window.attachAddToCartButtons();
    }
  };

  fetchProducts();
});
