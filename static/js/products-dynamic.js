document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");
  if (!productList) {
    console.warn("⛔ #product-list non trouvé au DOM");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/sync-products");
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products)) {
      console.error("❌ Réponse invalide :", data);
      return;
    }

    console.log("✅ Produits reçus :", data.products);

    data.products.forEach((product) => {
      const html = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4 product-info">
          <div class="card h-100">
            <img class="card-img-top" src="${product.image}" alt="${product.name}">
            <div class="card-body text-center">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.price} TND</p>
              <button 
                class="btn btn-outline-dark add-to-cart"
                data-id="${product.id}"
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="${product.image}">
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>`;
      productList.insertAdjacentHTML("beforeend", html);
    });

    // Sécurisation des boutons après injection
    if (typeof attachAddToCartButtons === "function") {
      setTimeout(() => {
        attachAddToCartButtons();
      }, 100);
    }

  } catch (err) {
    console.error("💥 Erreur d’injection produits :", err);
  }
});
