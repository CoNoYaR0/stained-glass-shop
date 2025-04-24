document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");
  if (!container) return;

  try {
    const res = await fetch("https://proxy-dolibarr-production.up.railway.app/products");
    const products = await res.json();

    console.log("📦 Produits chargés :", products);

    container.innerHTML = await Promise.all(products.map(async (prod, index) => {
      const name = prod.ref || prod.label || "Nom inconnu";
      const price = isNaN(parseFloat(prod.price)) ? "?" : parseFloat(prod.price).toFixed(2);
      const stock = prod.stock_reel ?? 'N/A';
      const id = prod.id || prod.ref || name;
      const ref = prod.ref;

      const imgBase = `https://www.stainedglass.tn/stainedglass-cdn/products/${ref}/${ref}-showcase-`;
      const validImages = [];

      for (let i = 1; i <= 4; i++) {
        const url = imgBase + i + ".png";
        const exists = await new Promise(resolve => {
          const test = new Image();
          test.onload = () => resolve(true);
          test.onerror = () => resolve(false);
          test.src = url;
        });
        if (exists) validImages.push(url);
      }

      const sliderHTML = validImages.length ? `
        <div class="swiper swiper-${index}">
          <div class="swiper-wrapper">
            ${validImages.map(img => `
              <div class="swiper-slide">
                <img src="${img}" alt="${name}" style="width: 100%; border-radius: 8px;" />
              </div>
            `).join('')}
          </div>
          <div class="swiper-pagination"></div>
        </div>
      ` : '';

      return `
        <div class="product-card" style="
          border: 2px solid orange;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          box-shadow: 0 0 15px rgba(0,0,0,0.05);
          max-width: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        ">
          ${sliderHTML}
          <h4 style="font-weight: bold; color: #333; word-break: break-word;">${name}</h4>
          <p>Prix : ${price} DT HT</p>
          <p>Stock : ${stock}</p>
          <button class="add-to-cart bounce-on-click"
            data-id="${id}"
            data-name="${name}"
            data-price="${price}">
            Ajouter au panier
          </button>
        </div>
      `;
    })).then(html => html.join(''));

    attachAddToCartButtons();

    document.querySelectorAll('.swiper').forEach((el, i) => {
      new Swiper('.swiper-' + i, {
        loop: true,
        pagination: {
          el: '.swiper-' + i + ' .swiper-pagination',
          clickable: true
        }
      });
    });
  } catch (err) {
    console.error("Erreur de chargement des produits :", err);
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
  }
});