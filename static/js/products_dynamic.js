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

      // 🆕 Group products by parent (detect C1, C2, etc.)
      const grouped = {};
      raw.forEach(item => {
        const baseName = item.name.replace(/ C\d+$/, ""); // Remove suffix like " C1"
        if (!grouped[baseName]) {
          grouped[baseName] = {
            id: item.dolibarr_product_id || item.id,
            name: baseName.replace(/[_-]/g, " "), // Clean underscores/dashes
            category: item.categories?.[0]?.name || "Uncategorized",
            description: item.description || "",
            variants: []
          };
        }

        // Detect variant attribute (dimension, color, etc.)
        let attributeType = "Generic";
        let attributeValue = "";

        const desc = item.description?.toLowerCase() || "";
        if (/(\d+cm|\d+x\d+)/i.test(desc)) {
          attributeType = "Dimension";
          attributeValue = desc.match(/(\d+cm|\d+x\d+)/i)?.[0] || "";
        } else if (/rouge|bleu|vert|jaune/i.test(desc)) {
          attributeType = "Color";
          attributeValue = desc.match(/rouge|bleu|vert|jaune/i)?.[0] || "";
        } else {
          attributeValue = item.name.match(/C\d+$/)?.[0] || "";
        }

        grouped[baseName].variants.push({
          sku: item.sku,
          price: Math.round(item.price || 0),
          stock: item.stock_levels?.[0]?.quantity || 0,
          images: item.images || [],
          attributeType,
          attributeValue
        });
      });

      renderProducts(Object.values(grouped));
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

      // Determine image URL: first image or fallback
      let imgUrl = v0.images.length && v0.images[0].cdn_url
        ? v0.images[0].cdn_url
        : FALLBACK_IMG;

      // Clean SKU for display
      const cleanSKU     = v0.sku.replace(/[_-]/g, " ");
      const roundedPrice = v0.price;
      const stockCount   = v0.stock;

      // 🆕 Create variant selector
      let variantSelector = "";
      if (product.variants.length > 1) {
        if (v0.attributeType === "Color") {
          // Color picker
          variantSelector = `
            <div class="variant-selector colors">
              ${product.variants.map(variant => `
                <button class="color-swatch" 
                        style="background-color:${variant.attributeValue};"
                        title="${variant.attributeValue}"
                        data-sku="${variant.sku}"
                        ${variant.stock <= 0 ? "disabled" : ""}></button>
              `).join("")}
            </div>
          `;
        } else {
          // Dropdown for dimensions/others
          variantSelector = `
            <select class="variant-dropdown">
              ${product.variants.map(variant => `
                <option value="${variant.sku}" ${variant.stock <= 0 ? "disabled" : ""}>
                  ${variant.attributeValue} ${variant.stock <= 0 ? "(Out of stock)" : ""}
                </option>
              `).join("")}
            </select>
          `;
        }
      }

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
              <h4 class="mb-2 link-title">${product.name} (${cleanSKU})</h4>
              <p class="category">${product.category}</p>
              <p class="stock">${stockCount} in stock</p>
              <p class="price">${roundedPrice} TND</p>
              ${variantSelector}
            </div>
          </div>
        </div>
      `;
      productGrid.insertAdjacentHTML("beforeend", cardHTML);
    });

    if (window.attachAddToCartButtons) {
      console.log("🔗 Attaching Add to Cart buttons…");
      window.attachAddToCartButtons();
    }
  };

  fetchProducts();
});
