// static/js/products_dynamic.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

  // 1) On récupère tous les produits depuis le proxy Dolibarr
  let products = [];
  try {
    const res = await fetch("https://cdn.stainedglass.tn/proxy/products.php");
    products = await res.json();
    if (!Array.isArray(products)) throw new Error("Expected array");
    console.log("✅ Produits chargés :", products);
  } catch (err) {
    console.error("❌ Erreur de chargement global des produits :", err);
    container.innerHTML = `<p>Erreur de chargement des produits.</p>`;
    return;
  }

  // 2) On regroupe par référence de base
  const grouped = {};
  products.forEach(prod => {
    // Exemple : prod.ref = "Assiette-sidi-red" → baseRef = "Assiette"
    const baseRef = prod.ref.split('-')[0];
    if (!grouped[baseRef]) {
      grouped[baseRef] = { base: prod, variants: [] };
    }
    if (prod.ref === baseRef) {
      grouped[baseRef].base = prod;
    } else {
      grouped[baseRef].variants.push(prod);
    }
  });

  // 3) On génère le HTML pour chaque groupe
  const htmlPieces = await Promise.all(
    Object.entries(grouped).map(async ([baseRef, group]) => {
      const prod      = group.base;
      const ref       = prod.ref; // ex: "Assiette_sidi"
      const price     = parseFloat(prod.price) || 0;
      const stock     = prod.stock_reel !== undefined ? prod.stock_reel : "N/A";
      const id        = prod.id || prod.ref || ref;
      const label     = prod.label || "Nom inconnu";
      const displayRef= ref.replace(/_/g, " ");

      // URL de l'image
      const imageUrl = `https://cdn.stainedglass.tn/stainedglass-img-cache/${ref}.jpg`;

      // 3.1) Slider Swiper pour la variante de base
      const sliderHTML = `
        <div class="swiper swiper-${id}">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <img src="${imageUrl}"
                   alt="${displayRef}"
                   onerror="this.src='/img/fallback.jpg'"
                   class="w-100" />
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>`;

      // 3.2) Si variantes, on prépare un <select> pour les choisir
      const variantSelect = group.variants.length ? `
        <label for="variants-${id}">Variantes&nbsp;:</label>
        <select id="variants-${id}" class="variant-select" data-base="${ref}">
          <option value="${ref}">${displayRef}</option>
          ${group.variants.map(v => {
            const disp = v.ref.replace(/_/g, " ");
            return `<option value="${v.ref}">${disp}</option>`;
          }).join("")}
        </select>` : "";

      // 3.3) On enveloppe la carte dans un lien vers /products/<REF>/
      //       et on insère le bouton “Ajouter au panier” DANS le lien,
      //       mais **on bloquera la propagation du click** pour que le bouton n’active pas le lien.
      return `
        <a href="/products/${ref}/" 
           class="product-card-link d-block text-decoration-none mb-4"
           style="width: 100%; max-width: 360px;">
          <div class="card h-100 border-warning">
            ${sliderHTML}
            <div class="card-body">
              <h5 class="card-title">${displayRef}</h5>
              <p class="card-text mb-1">Prix&nbsp;: ${price.toFixed(2)} DT HT</p>
              <p class="card-text mb-2">Stock&nbsp;: ${stock}</p>
              ${variantSelect}
              <button type="button"
                      class="add-to-cart btn btn-warning mt-3"
                      data-id="${id}"
                      data-name="${ref}"
                      data-price="${price}"
                      data-image="${imageUrl}">
                Ajouter au panier
              </button>
            </div>
          </div>
        </a>`;
    })
  );

  // 4) On injecte l’ensemble du HTML dans le conteneur
  container.innerHTML = htmlPieces.join("");

  // 5) On branche les événements “Ajouter au panier”
  attachAddToCartButtons(); // fonction que tu avais déjà

  // 7) Initialisation Swiper (slider) après un petit délai
  // Note: Le point 6) a été supprimé car il dupliquait la logique d'attachement des événements.
  setTimeout(() => {
    document.querySelectorAll('.swiper').forEach(el => {
      new Swiper(el, {
        pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
        loop: false
      });
    });
  }, 100);
});
