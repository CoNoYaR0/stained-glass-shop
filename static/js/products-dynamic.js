
document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list") || document.getElementById("dynamic-products");
  const filterContainer = document.getElementById("category-filters");

  try {
    const res = await fetch("/.netlify/functions/get-products");
    const products = await res.json();

    const categories = new Set();
    products.forEach(p => {
      (p.categories || []).forEach(c => categories.add(c.label));
    });

    if (filterContainer) {
      filterContainer.innerHTML = '<button class="btn btn-outline-primary btn-sm filter-btn me-2" data-cat="all">Tous</button>';
      categories.forEach(label => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-secondary btn-sm filter-btn me-2";
        btn.dataset.cat = label;
        btn.textContent = label;
        filterContainer.appendChild(btn);
      });
    }

    const renderProducts = (filterCat = "all") => {
      productList.innerHTML = "";
      products.forEach(product => {
        const inCat = filterCat === "all" || (product.categories || []).some(c => c.label === filterCat);
        if (!inCat || parseFloat(product.stock_real) <= 0) return;

        const col = document.createElement("div");
        col.className = "col-md-4 mb-4";
        col.innerHTML = `
          <div class="card h-100 product-card">
            <img src="/images/products/${product.id}.jpg" class="card-img-top" alt="${product.label}">
            <div class="card-body">
              <h5 class="card-title">${product.label}</h5>
              <p class="card-text">${product.description || ""}</p>
              <p class="price"><strong>${product.price} TND</strong></p>
              <button class="btn btn-main add-to-cart"
                      data-id="${product.id}"
                      data-name="${product.label}"
                      data-price="${product.price}"
                      data-image="/images/products/${product.id}.jpg">
                🛒 Ajouter au panier
              </button>
            </div>
          </div>
        `;
        productList.appendChild(col);
      });

      if (typeof attachAddToCartButtons === "function") {
        attachAddToCartButtons();
      }
    };

    renderProducts();

    if (filterContainer) {
      filterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
          renderProducts(e.target.dataset.cat);
        }
      });
    }

  } catch (err) {
    console.error("Erreur chargement produits:", err);
    productList.innerHTML = "<p class='text-danger'>Impossible de charger les produits.</p>";
  }
});
