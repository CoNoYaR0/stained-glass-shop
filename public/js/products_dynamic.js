document.addEventListener("DOMContentLoaded", () => {
  const API_URL      = "https://dolibarr-middleware.onrender.com/api/v1/products";
  const CDN_BASE_URL = "https://cdn.stainedglass.tn";
  const FALLBACK_IMG = `${CDN_BASE_URL}/images/fallback.jpg`;
  const HEALTH_URL   = "https://dolibarr-middleware.onrender.com/health";
  const productGrid  = document.getElementById("product-grid");

  if (!productGrid) {
    console.error("❌ productGrid not found in DOM");
    return;
  }

  // ─── Keep-alive ping ──────────────────────────────────────────────────────────
  function keepAlive() {
    fetch(HEALTH_URL).catch(() => {});
  }
  keepAlive();
  setInterval(keepAlive, 10 * 60 * 1000);

  // ─── Fetch & group products ──────────────────────────────────────────────────
  const fetchProducts = async () => {
    console.log("📡 Fetching products from API:", API_URL);
    try {
      const res    = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const raw    = Array.isArray(result.data) ? result.data : [];
      console.log("✅ API returned data array:", raw);

      if (!raw.length) {
        productGrid.innerHTML = "<p>No products available.</p>";
        return;
      }

      const grouped = {};
      raw.forEach(item => {
        const baseName = item.name.replace(/ C\d+$/, "");
        const tags = Array.isArray(item.categories)
          ? item.categories.map(c => c.name)
          : [];

        if (!grouped[baseName]) {
          grouped[baseName] = {
            id:       item.dolibarr_product_id || item.id,
            tags,
            variants: []
          };
        }

        let attributeType  = "Generic";
        let attributeValue = "";
        const desc = (item.description || "").toLowerCase();
        if (/(\d+cm|\d+x\d+)/i.test(desc)) {
          attributeType  = "Dimension";
          attributeValue = desc.match(/(\d+cm|\d+x\d+)/i)[0];
        } else if (/rouge|bleu|vert|jaune/i.test(desc)) {
          attributeType  = "Color";
          attributeValue = desc.match(/rouge|bleu|vert|jaune/i)[0];
        } else {
          attributeValue = item.name.match(/C\d+$/)?.[0] || "";
        }

        grouped[baseName].variants.push({
          sku:            item.sku,
          price:          Math.round(item.price || 0),
          stock:          item.stock_levels?.[0]?.quantity || 0,
          images:         item.images || [],
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

  // ─── Render products ─────────────────────────────────────────────────────────
  const renderProducts = (products) => {
    productGrid.innerHTML = "";

    products.forEach(product => {
      const v0 = product.variants[0];
      let cleanSKU = v0.sku
        .replace(/[_-]/g, " ")
        .replace(/\s*C\d+$/, "")
        .replace(/[()]/g, "")
        .trim();

      const allTags = product.tags.length
        ? product.tags.join(", ")
        : "Uncategorized";

      const imgUrl = (v0.images.length && v0.images[0].cdn_url)
        ? v0.images[0].cdn_url
        : FALLBACK_IMG;

      let variantSelector = "";
      if (product.variants.length > 1) {
        if (v0.attributeType === "Color") {
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
              <img class="img-fluid" src="${imgUrl}" alt="${cleanSKU}">
              <div class="overlay">
                <button class="add-to-cart translucent-btn"
                        data-id="${v0.sku}"
                        data-name="${cleanSKU}"
                        data-price="${v0.price}"
                        data-image="${imgUrl}"
                        ${v0.stock <= 0 ? "disabled" : ""}>
                  ${v0.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
            <div class="product-info">
              <a href="single.html?sku=${v0.sku}" style="text-decoration: none;">
                <h4 class="mb-2 link-title">${cleanSKU}</h4>
              </a>
              <p class="tags">${allTags}</p>
              <p class="stock">${v0.stock} in stock</p>
              <p class="price">${v0.price} TND</p>
              ${variantSelector}
            </div>
          </div>
        </div>
      `;
      productGrid.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Dispatch a custom event to let other scripts know the products have been rendered
    const event = new Event('productRendered');
    document.dispatchEvent(event);
  };

  fetchProducts();
});
