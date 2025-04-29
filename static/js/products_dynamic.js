// products_dynamic.js (corrigé pour afficher 1 carte par produit parent)

const container = document.getElementById("products-list");

try {
  const res = await fetch("https://www.stainedglass.tn/proxy/products.php");
  const products = await res.json();
  console.log("Produits chargés :", products);

  // 1. Grouper par ref principale (sans variante)
  const grouped = {};
  for (const prod of products) {
    const ref = prod.ref;
    const baseRef = ref.replace(/[-_]?variant[e]?[ _-]?[0-9]+$/i, '').toLowerCase();
    if (!grouped[baseRef]) grouped[baseRef] = [];
    grouped[baseRef].push(prod);
  }

  // 2. Construire les cartes produit
  const html = await Promise.all(
    Object.entries(grouped).map(async ([baseRef, variants]) => {
      const main = variants[0];
      const ref = main.ref;
      const label = main.label || ref;
      const name = ref.replace(/_/g, ' ');
      const price = parseFloat(main.price) || 0;
      const stock = main.stock_reel !== undefined ? main.stock_reel : "N/A";
      const id = main.id || ref;

      // 3. Récupérer toutes les images associées
      let images = [];
      for (const variant of variants) {
        const vref = variant.ref;
        try {
          const imgRes = await fetch(`https://www.stainedglass.tn/proxy/product_images.php?id=${encodeURIComponent(vref)}`);
          if (imgRes.ok && imgRes.headers.get('content-type')?.includes('application/json')) {
            const imgData = await imgRes.json();
            if (imgData?.images?.length) images.push(...imgData.images);
          }
        } catch (err) {
          console.warn(`Pas d'image JSON pour ${vref}`, err);
        }
      }

      const sliderHTML = images.length
        ? `<div class="swiper swiper-${id}"><div class="swiper-wrapper">` +
          images.map(img => `<div class='swiper-slide'><img src='${img}' alt='${name}' /></div>`).join('') +
          `</div><div class="swiper-pagination"></div></div>`
        : '';

      return `
        <div class="product-card">
          ${sliderHTML}
          <h3>${label}</h3>
          <p>Prix : ${price.toFixed(2)} DT HT</p>
          <p>Stock : ${stock}</p>
          <button class="add-to-cart bounce-on-click"
            data-id="${id}"
            data-name="${name}"
            data-price="${price}"
            data-image="${images[0] || ''}"
          >Ajouter au panier</button>
        </div>`;
    })
  );

  container.innerHTML = html.join("");

  attachAddToCartButtons();
  document.querySelectorAll(".swiper").forEach((el, i) => {
    new Swiper(el, {
      pagination: { el: el.querySelector(".swiper-pagination"), clickable: true },
      loop: true,
    });
  });

} catch (error) {
  console.error("Erreur de chargement global des produits :", error);
  container.innerHTML = "<p>Erreur de chargement des produits</p>";
}
