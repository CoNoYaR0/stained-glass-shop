document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

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

  // On regroupe par référence de base (ex : "Assiette" puis variantes "Assiette_blue", "Assiette_red", etc.)
  const grouped = {};
  products.forEach(prod => {
    const baseRef = prod.ref.split('-')[0];
    if (!grouped[baseRef]) {
      grouped[baseRef] = {
        base: prod,
        variants: []
      };
    }
    if (prod.ref === baseRef) {
      grouped[baseRef].base = prod;
    } else {
      grouped[baseRef].variants.push(prod);
    }
  });

  // On génère le HTML pour chacune des cartes en les enveloppant dans <a href="/products/REF/">
  const html = await Promise.all(
    Object.entries(grouped).map(async ([baseRef, group]) => {
      const prod = group.base;
      const ref = prod.ref; // ex : "Assiette_sidi"
      const price = parseFloat(prod.price) || 0;
      const stock = prod.stock_reel !== undefined ? prod.stock_reel : "N/A";
      const id = prod.id || prod.ref || ref;
      const name = prod.label || "Nom inconnu";
      const displayRef = ref.replace(/_/g, " ");

      // On construit l'URL de l'image
      const imageUrl = `https://cdn.stainedglass.tn/stainedglass-img-cache/${ref}.jpg`;

      // Si vous voulez un slider pour les variantes, gardez cette partie inchangée
      const sliderHTML = `
        <div class="swiper swiper-${id}">
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <img src="${imageUrl}" alt="${displayRef}" onerror="this.src='/img/fallback.jpg'" />
            </div>
          </div>
          <div class="swiper-pagination"></div>
        </div>`;

      // S'il y a des variantes, on peut laisser la <select> ici si besoin
      const variantSelect = group.variants.length ? `
        <label>Variantes :</label>
        <select class="variant-select" data-base="${ref}">
          <option value="${ref}">${ref.replace(/_/g, ' ')}</option>
          ${group.variants.map(v => `<option value="${v.ref}">${v.ref.replace(/_/g, ' ')}</option>`).join('')}
        </select>` : "";

      // → On enveloppe la carte dans un lien vers /products/{{ref}}/
      return `
        <a href="/products/${ref}/" class="product-card-link" style="text-decoration: none;">
          <div class="product-card">
            ${sliderHTML}
            <h3>${displayRef}</h3>
            <p>Prix : ${price} DT HT</p>
            <p>Stock : ${stock}</p>
            ${variantSelect}
            <button type="button" class="add-to-cart bounce-on-click"
              data-id="${id}"
              data-name="${ref}"
              data-price="${price}"
              data-image="${imageUrl}"
            >Ajouter au panier</button>
          </div>
        </a>`;
    })
  );

  container.innerHTML = html.join("");
  attachAddToCartButtons();

  // Initialisation de Swiper (slider) après un petit délai pour laisser le DOM se mettre en place
  setTimeout(() => {
    document.querySelectorAll('.swiper').forEach((el) => {
      new Swiper(el, {
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true
        },
        loop: false,
      });
    });
  }, 100);
});
