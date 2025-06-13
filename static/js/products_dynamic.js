// static/js/products_dynamic.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

  // 1) On récupère tous les produits depuis le proxy Dolibarr
  let products = [];
  try {
    const res = await fetch("https://cdn.stainedglass.tn/proxy/products.php");
    products = await res.json();
    console.log(JSON.stringify(products, null, 2));
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
    // Normalize prod.ref and prod.id by trimming whitespace
    if (prod.ref) prod.ref = prod.ref.trim();
    if (prod.id) prod.id = prod.id.trim();
    console.log(`Raw product ref: '${prod.ref}', Raw product id: '${prod.id}'`);
    // Exemple : prod.ref = "Assiette-sidi-red" → baseRef = "Assiette"
    const baseRef = prod.ref.split('-')[0].trim(); // Ensure baseRef used for grouping is trimmed.
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
    Object.entries(grouped).map(async ([baseRefRaw, group]) => {
      const baseRef   = baseRefRaw.trim(); // Ensure baseRef is trimmed for safety.
      const prod      = group.base;
      // prod.ref and prod.id are already trimmed from the products.forEach loop.
      const ref       = prod.ref; // This is the specific product's ref, already trimmed.
      const price     = parseFloat(prod.price) || 0;
      const stock     = prod.stock_reel !== undefined ? prod.stock_reel : "N/A";

      // elementId for HTML elements like swiper, variants select. Uses baseRef as fallback for grouping logic.
      // Ensure components are trimmed before use. prod.id and prod.ref are already trimmed.
      const elementId = prod.id || ref || baseRef;

      const label     = prod.label || "Nom inconnu";
      const displayRef= ref.replace(/_/g, " ");

      // dataIdValue for the button, should be specific to the product, prioritizing prod.id then prod.ref.
      // prod.id and prod.ref are already trimmed.
      let dataIdValue = prod.id ? prod.id : ref;
      if (!dataIdValue) dataIdValue = ''; // Ensure it's a string for data-id, fallback to empty if both are null/undefined

      // URL de l'image (uses the trimmed 'ref')
      const imageUrl = `https://cdn.stainedglass.tn/stainedglass-img-cache/${ref}.jpg`;

      // 3.1) Slider Swiper pour la variante de base
      const sliderHTML = `
        <div class="swiper swiper-${elementId}">
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
        <label for="variants-${elementId}">Variantes&nbsp;:</label>
        <select id="variants-${elementId}" class="variant-select" data-base="${ref}">
          <option value="${ref}">${displayRef}</option>
          ${group.variants.map(v => {
            // Assuming v.ref was also trimmed in the initial loop if it's from the same products array
            // If variants are different objects, they might need trimming here:
            // const variantRef = v.ref ? v.ref.trim() : '';
            // const disp = variantRef.replace(/_/g, " ");
            // return `<option value="${variantRef}">${disp}</option>`;
            // For now, assume v.ref is clean as it's from the same source `products`
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
                      data-id="${dataIdValue}"
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
