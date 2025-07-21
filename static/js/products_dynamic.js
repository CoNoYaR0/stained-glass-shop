document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const productGrid = document.getElementById("product-grid");

  if (!productGrid) {
    console.error("❌ productGrid not found in DOM");
    return;
  }

  const fetchProducts = async () => {
    console.log("📡 Fetching products from API:", API_URL);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result   = await response.json();       // { data: [...], pagination: {...} }
      const products = Array.isArray(result.data)     // on s’assure d’avoir un tableau
        ? result.data
        : [];

      console.log("✅ API returned data array:", products);

      if (!products.length) {
        console.warn("⚠️ No products found in API response.");
        productGrid.innerHTML = "<p>No products available.</p>";
        return;
      }

      renderProducts(products);

    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      productGrid.innerHTML = "<p>Failed to load products. Please try again later.</p>";
    }
  };

  const renderProducts = (products) => {
    console.log("🖌 Rendering products...");
    productGrid.innerHTML = ""; // Clear existing content

    products.forEach((product) => {
      if (!product.variants || product.variants.length === 0) return;

      const firstVariant = product.variants[0];
      const imageUrl = firstVariant.images.length > 0
        ? firstVariant.images[0].url
        : "https://via.placeholder.com/300";

      // Si plusieurs variantes, on crée un selecteur
      const variantSelector = product.variants.length > 1
        ? `
          <select class="variant-selector" data-product-id="${product.id}">
            ${product.variants.map(
              (variant) => `
              <option value="${variant.sku}"
                data-price="${variant.price}"
                data-stock="${variant.stock}">
                ${variant.name}
              </option>`
            ).join("")}
          </select>
        `
        : "";

      const productCard = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="block product-card">
            <div class="image-container">
              <img class="img-fluid" src="${imageUrl}" alt="${product.name}">
              <div class="overlay">
                <button class="add-to-cart translucent-btn"
                  data-id="${firstVariant.sku}"
                  data-name="${product.name}"
                  data-price="${firstVariant.price}"
                  data-image="${imageUrl}"
                  ${firstVariant.stock <= 0 ? "disabled" : ""}
                >
                  ${firstVariant.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div class="product-info">
              <h4 class="mb-2"><a href="#" class="link-title">${product.name}</a></h4>
              <p class="sku">SKU: ${firstVariant.sku}</p>
              <p class="tags">${(product.tags || []).join(", ")}</p>
              ${variantSelector}
              <p class="price">${firstVariant.price} TND</p>
            </div>
          </div>
        </div>
      `;

      productGrid.insertAdjacentHTML("beforeend", productCard);
    });

    // Ré-attache les boutons Add to Cart
    if (window.attachAddToCartButtons) {
      console.log("🔗 Attaching Add to Cart buttons...");
      window.attachAddToCartButtons();
    }

    // Gère le changement de variante
    document.querySelectorAll(".variant-selector").forEach((selector) => {
      selector.addEventListener("change", (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const cardBtn = e.target.closest(".product-card").querySelector(".add-to-cart");
        cardBtn.dataset.id    = opt.value;
        cardBtn.dataset.price = opt.dataset.price;
        cardBtn.textContent   = opt.dataset.stock <= 0 ? "Out of Stock" : "Add to Cart";
        cardBtn.disabled      = opt.dataset.stock <= 0;
      });
    });
  };

  fetchProducts();
});
