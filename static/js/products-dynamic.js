document.addEventListener("DOMContentLoaded", async () => {
    const productList = document.getElementById("product-list");
  
    if (!productList) {
      console.warn("🛑 #product-list introuvable dans le DOM");
      return;
    }
  
    try {
      const res = await fetch("/.netlify/functions/sync-products");
      const data = await res.json();
  
      if (!data.success || !Array.isArray(data.products)) {
        console.error("❌ Erreur format ou données produits invalides", data);
        return;
      }
  
      productList.innerHTML = ""; // reset du container
  
      data.products.forEach(product => {
        const html = `
          <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="block">
              <div class="gallery-overlay">
                <a href="/produit/${product.id}" class="gallery-popup">
                  <i class="tf-ion-plus-round"></i>
                </a>
              </div>
              <img class="img-fluid" src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
              <h4 class="mb-2">
                <a href="/produit/${product.id}" class="link-title">${product.name}</a>
              </h4>
              <p class="price">${product.price.toFixed(2)} TND</p>
  
              <div class="text-center mt-2">
                <button class="btn btn-sm btn-outline-primary add-to-cart"
                  data-id="${product.id}"
                  data-name="${product.name}"
                  data-price="${product.price}"
                  data-image="${product.image}"
                  ${product.stock === 0 ? "disabled" : ""}>
                  ${product.stock === 0 ? "Sold Out" : "Ajouter au panier"}
                </button>
              </div>
            </div>
          </div>
        `;
  
        productList.insertAdjacentHTML("beforeend", html);
      });
  
      // Relancer les boutons après injection
      if (typeof attachAddToCartButtons === "function") {
        attachAddToCartButtons();
      } else {
        console.warn("⚠️ Fonction attachAddToCartButtons non trouvée");
      }
    } catch (err) {
      console.error("💥 Erreur chargement produits:", err);
    }
  });
  