// products_dynamic.js

const container = document.getElementById("products-list");

async function loadProducts() {
  try {
    const res = await fetch("https://www.stainedglass.tn/proxy/products.php?all=1");
    const products = await res.json();

    if (!Array.isArray(products)) throw new Error("Mauvais format JSON reçu");

    const uniqueProducts = {};
    products.forEach(prod => {
      if (!uniqueProducts[prod.ref]) uniqueProducts[prod.ref] = prod;
    });

    const html = await Promise.all(
      Object.values(uniqueProducts).map(async (prod) => {
        const ref = prod.ref;
        const label = prod.label || "Produit";
        const name = prod.label || "Nom inconnu";
        const price = parseFloat(prod.price) || 0;
        const stock = prod.stock_reel !== undefined ? prod.stock_reel : "N/A";
        const id = prod.id || ref;

        let images = [];
        try {
          const possible = ["jpg", "jpeg", "png", "webp"];
          for (const ext of possible) {
            let idx = 1;
            while (true) {
              const filename = idx === 1 ? `${ref}.${ext}` : `${ref}-${idx}.${ext}`;
              const url = `https://www.stainedglass.tn/stainedglass-img-cache/${filename}`;
              const resp = await fetch(url, { method: "HEAD" });
              if (resp.ok) {
                images.push(url);
                idx++;
              } else {
                break;
              }
            }
          }
        } catch (e) {
          console.warn("Pas d'image JSON pour le produit:", name);
        }

        const sliderHTML = images.length
          ? `
            <div class="swiper swiper-${id}">
              <div class="swiper-wrapper">
                ${images
                  .map((img, i) => `<div class="swiper-slide"><img src="${img}" alt="${label}" /></div>`)
                  .join("")}
              </div>
              <div class="swiper-pagination"></div>
            </div>
          `
          : "";

        const displayRef = ref.replaceAll("_", " ");

        return `
          <div class="product-card">
            ${sliderHTML}
            <h3>${displayRef}</h3>
            <p>Prix : ${price} DT HT</p>
            <p>Stock : ${stock}</p>
            <button class="add-to-cart bounce-on-click"
              data-id="${id}"
              data-name="${name}"
              data-price="${price}"
              data-image="${images[0] || ""}">
              Ajouter au panier
            </button>
          </div>
        `;
      })
    );

    container.innerHTML = html.join("");
    attachAddToCartButtons();

    document.querySelectorAll(".swiper").forEach((el, i) => {
      new Swiper(el, {
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
