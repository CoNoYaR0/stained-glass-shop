document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");
  if (!container) return;

  try {
    const response = await (await fetch("https://www.stainedglass.tn/proxy/products.php")).json();
    const products = Array.isArray(response) ? response : Object.values(response);

    console.log("📦 Produits chargés :", products);

    container.innerHTML = await Promise.all(products.map(async (prod, index) => {
      const name = prod.ref || prod.label || "Nom inconnu";
      const price = !isNaN(parseFloat(prod.price)) ? parseFloat(prod.price).toFixed(2) : "?";
      const stock = prod.stock_reel !== undefined ? prod.stock_reel : 'N/A';
      const id = prod.id || prod.ref || name;
      const ref = prod.ref || "";

      const validImages = [];

      try {
        const imgRes = await fetch(`https://www.stainedglass.tn/proxy/product_images.php?id=${encodeURIComponent(ref || name)}`);
        const imgData = await imgRes.json();
        if (imgData?.images?.length) validImages.push(...imgData.images);
      } catch (error) {
        console.error("⚠️ Erreur récupération images pour :", name, error);
      }

      const sliderHTML = validImages.length ? `
        <div class="swiper swiper-${index}">
          <div class="swiper-wrapper">
            ${validImages.map(img => `
              <div class="swiper-slide">
                <img src="${img}" alt="${name}" loading="lazy" />
              </div>
            `).join('')}
          </div>
          <div class="swiper-pagination"></div>
        </div>
      ` : '';

      return `
        <div class="product-card">
          ${sliderHTML}
          <h4>${name}</h4>
          <p>Prix : ${price} DT HT</p>
          <p>Stock : ${stock}</p>
          <button class="add-to-cart bounce-on-click"
            data-id="${id}"
            data-name="${name}"
            data-price="${price}"
            data-image="${validImages[0] || ''}">
            Ajouter au panier
          </button>
        </div>
      `;
    })).then(html => html.join(''));

    attachAddToCartButtons();

    // Initialisation Swiper proprement
    document.querySelectorAll('.swiper').forEach((el, i) => {
      new Swiper('.swiper-' + i, {
        loop: true,
        pagination: {
          el: '.swiper-' + i + ' .swiper-pagination',
          clickable: true
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false
        }
      });
    });

  } catch (err) {
    console.error("🚨 Erreur de chargement global des produits :", err);
    container.innerHTML = "<p>Erreur de chargement des produits.</p>";
  }
});
