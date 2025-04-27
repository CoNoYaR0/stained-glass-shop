// products_dynamic.js corrigé 100% avec ref affiché

async function loadProducts() {
  const container = document.getElementById("products-list");
  container.innerHTML = "Chargement...";

  try {
    const response = await fetch("https://www.stainedglass.tn/proxy/products.php");
    const products = await response.json();

    if (!Array.isArray(products)) {
      console.error("Erreur: format de données inattendu", products);
      container.innerHTML = "Erreur de chargement des produits.";
      return;
    }

    const html = products.map((prod) => {
      const ref = prod.ref || "Nom_inconnu";
      const displayRef = ref.replace(/_/g, ' ');
      const price = parseFloat(prod.price) || 0;
      const stock = prod.stock_reel !== undefined ? prod.stock_reel : "sold out";
      const id = prod.id || ref;
      const imageUrl = `https://www.stainedglass.tn/stainedglass-img-cache/${encodeURIComponent(ref)}.jpg`;

      return `
        <div class="product-card">
          <div class="swiper swiper-${id}">
            <div class="swiper-wrapper">
              <div class="swiper-slide">
                <img src="${imageUrl}" alt="${displayRef}" />
              </div>
            </div>
            <div class="swiper-pagination"></div>
          </div>
          <h3>${displayRef}</h3>
          <p>Prix : ${price} DT HT</p>
          <p>Stock : ${stock}</p>
          <button class="add-to-cart bounce-on-click"
            data-id="${id}"
            data-name="${displayRef}"
            data-price="${price}"
            data-image="${imageUrl}">
            Ajouter au panier
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    attachAddToCartButtons();

    document.querySelectorAll('.swiper').forEach((el) => {
      new Swiper(el, {
        loop: true,
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true,
        },
      });
    });
  } catch (error) {
    console.error("Erreur de chargement global des produits :", error);
    container.innerHTML = "Erreur de chargement des produits.";
  }
}

loadProducts();
