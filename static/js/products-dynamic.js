document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");
  if (!productList) {
    console.warn("⛔ #product-list non trouvé dans le DOM");
    return;
  }

  const loadProductImages = (ref, max = 5) => {
    const images = [`/products/${ref}/main.png`];
    for (let i = 1; i <= max; i++) {
      images.push(`/products/${ref}/image-${i}.png`);
    }
    return images;
  };

  try {
    const res = await fetch("/.netlify/functions/sync-products");
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products)) {
      console.error("❌ Réponse produit invalide :", data);
      return;
    }

    data.products.forEach((product) => {
      const images = loadProductImages(product.ref);
      const imageTags = images.map((src, i) => `
        <img src="${src}" alt="${product.name} - ${i}" 
             onerror="this.style.display='none'" 
             class="product-img ${i === 0 ? 'main-img' : 'extra-img'} w-100 mb-2">`
      ).join('');

      const html = `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4 product-info">
          <div class="card h-100">
            ${imageTags}
            <div class="card-body text-center">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.price} TND</p>
              <button 
                class="btn btn-outline-dark add-to-cart"
                data-id="${product.id}"
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="/products/${product.ref}/main.png">
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