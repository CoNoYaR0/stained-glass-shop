
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('products-list');
  if (!container) return;

  try {
    const response = await fetch('https://proxy-dolibarr-production.up.railway.app/products');
    const products = await response.json();

    if (!Array.isArray(products)) {
      console.error("❌ Données reçues invalides :", products);
      container.innerHTML = "<p>Erreur : données invalides depuis le serveur.</p>";
      return;
    }

    container.innerHTML = products.map((prod, index) => {
      const name = prod.ref || prod.label || "Nom inconnu";
      const price = isNaN(parseFloat(prod.price)) ? "?" : parseFloat(prod.price).toFixed(2);
      const stock = prod.stock_reel ?? 'N/A';
      const id = prod.id || prod.ref || name;
      const ref = prod.ref;

      const imgBase = `https://www.stainedglass.tn/stainedglass-cdn/products${ref}/${ref}`;
      const images = [1, 2, 3, 4].map(i => `${imgBase}-${i}.jpg`);

      const sliderHTML = `
        <div class="swiper swiper-${index}">
          <div class="swiper-wrapper">
            ${images.map(url => `
              <div class="swiper-slide">
                <img src="${url}" alt="${name}" style="width: 100%; border-radius: 8px;" onerror="this.closest('.swiper-slide').remove()">
              </div>
            `).join('')}
          </div>
          <div class="swiper-pagination"></div>
        </div>
      `;

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
    }).join('');

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
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
    console.error(err);
  }
});
