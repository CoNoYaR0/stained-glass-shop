document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");
  if (!productList) {
    console.warn("⛔ #product-list non trouvé dans le DOM");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/sync-products");
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products)) {
      console.error("❌ Réponse produit invalide :", data);
      return;
    }

    data.products.forEach((product) => {
      const imageUrl = `https://7ssab.stainedglass.tn/document.php?modulepart=product&entity=1&file=${encodeURIComponent(product.ref + '/' + product.ref + '-showcase-1.png')}`;
      const proxyUrl = `/.netlify/functions/proxy-image?url=${encodeURIComponent(imageUrl)}`;

      const html = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4 product-info">
          <div class="card h-100">
            <img class="card-img-top" src="${proxyUrl}" alt="${product.name}" onerror="this.src='/images/products/default.png'">
            <div class="card-body text-center">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.price} TND</p>
              <button 
                class="btn btn-outline-dark add-to-cart"
                data-id="${product.id}"
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="${proxyUrl}">
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>`;

      productList.insertAdjacentHTML("beforeend", html);
    });

    if (typeof attachAddToCartButtons === "function") {
      setTimeout(() => {
        attachAddToCartButtons();
      }, 100);
    }

  } catch (err) {
    console.error("💥 Erreur de chargement des produits:", err);
  }
});