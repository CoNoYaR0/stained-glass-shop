// products_dynamic.js avec support des variantes (dropdown + panier)

const container = document.getElementById("products-list");

async function loadProducts() {
  try {
    const res = await fetch("https://www.stainedglass.tn/proxy/products.php?all=1");
    const products = await res.json();

    if (!Array.isArray(products)) throw new Error("Mauvais format JSON reçu");

    // Grouper par base ref
    const grouped = {};
    for (const prod of products) {
      const base = prod.ref.replace(/[-_]?variant[e]?[ _-]?\d+$/i, '').toLowerCase();
      if (!grouped[base]) grouped[base] = [];
      grouped[base].push(prod);
    }

    const html = await Promise.all(
      Object.entries(grouped).map(async ([baseRef, variants]) => {
        const main = variants[0];
        const base = main.ref;
        const label = main.label || base;
        const name = base.replaceAll('_', ' ');
        const price = parseFloat(main.price) || 0;
        const stock = main.stock_reel !== undefined ? main.stock_reel : "N/A";
        const id = main.id || base;

        let images = [];
        for (const v of variants) {
          const ref = v.ref;
          const formats = ["jpg", "jpeg", "png", "webp"];
          for (const ext of formats) {
            let idx = 1;
            while (true) {
              const filename = idx === 1 ? `${ref}.${ext}` : `${ref}-${idx}.${ext}`;
              const url = `https://www.stainedglass.tn/stainedglass-img-cache/${filename}`;
              const resp = await fetch(url, { method: "HEAD" });
              if (resp.ok) {
                images.push({ url, ref });
                idx++;
              } else break;
            }
          }
        }

        const sliderHTML = images.length > 0
          ? `<div class="swiper swiper-${id}">
              <div class="swiper-wrapper">
                ${images.map(img => `<div class='swiper-slide'><img src='${img.url}' alt='${label}' /></div>`).join('')}
              </div>
              <div class="swiper-pagination"></div>
            </div>`
          : '';

        const variantSelect = `
          <label for="select-variant-${id}">Variante :</label>
          <select id="select-variant-${id}" class="variant-selector">
            ${variants.map(v => `<option value="${v.ref}">${v.ref.replaceAll('_', ' ')}</option>`).join('')}
          </select>`;

        return `
          <div class="product-card">
            ${sliderHTML}
            <h3>${name}</h3>
            <p>Prix : ${price.toFixed(2)} DT HT</p>
            <p>Stock : ${stock}</p>
            ${variantSelect}
            <button class="add-to-cart bounce-on-click"
              data-base-id="${id}"
              data-price="${price}"
              data-label="${label}">
              Ajouter au panier
            </button>
          </div>
        `;
      })
    );

    container.innerHTML = html.join('');

    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", () => {
        const baseId = btn.dataset.baseId;
        const price = parseFloat(btn.dataset.price);
        const label = btn.dataset.label;
        const select = document.getElementById(`select-variant-${baseId}`);
        const selectedRef = select?.value || baseId;
        const imageUrl = `https://www.stainedglass.tn/stainedglass-img-cache/${selectedRef}.jpg`;

        const product = {
          id: selectedRef,
          name: label + ' (' + selectedRef.replaceAll('_', ' ') + ')',
          price,
          image: imageUrl,
          quantity: 1
        };

        addToCart(product);
      });
    });

    document.querySelectorAll('.swiper').forEach((el) => {
      new Swiper(el, {
        loop: true,
        pagination: {
          el: el.querySelector(".swiper-pagination"),
          clickable: true,
        },
      });
    });

  } catch (error) {
    container.innerHTML = "<p>Erreur de chargement des produits.</p>";
    console.error("Erreur de chargement global des produits :", error);
  }
}

loadProducts();
