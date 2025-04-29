document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

  let products = [];
  try {
    const res = await fetch("https://www.stainedglass.tn/proxy/products.php");
    products = await res.json();
    if (!Array.isArray(products)) throw new Error("Expected array");
    console.log("✅ Produits chargés :", products);
  } catch (err) {
    console.error("❌ Erreur de chargement global des produits :", err);
    container.innerHTML = `<p>Erreur de chargement des produits.</p>`;
    return;
  }

  const html = await Promise.all(
    products.map(async (prod) => {
      const ref = prod.ref;
      const price = parseFloat(prod.price) || 0;
      const stock = prod.stock_reel !== undefined ? prod.stock_reel : "N/A";
      const id = prod.id || prod.ref || ref;
      const name = prod.label || "Nom inconnu";
      const displayRef = ref.replace(/_/g, " ");
      const displayLabel = name.replace(/_/g, " ");

      // Images
      let images = [];
      try {
        const imgRes = await fetch(`https://www.stainedglass.tn/proxy/product_images.php?id=${encodeURIComponent(ref)}`);
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (imgData?.images?.length) {
            images = imgData.images;
          } else {
            console.warn("⚠️ Pas d'image JSON pour le produit:", displayRef);
          }
        }
      } catch (e) {
        console.error("⚠️ Erreur parsing JSON pour:", name, e);
      }

      const sliderHTML = images.length > 0 ? `
        <div class="swiper swiper-${id}">
          <div class="swiper-wrapper">
            ${images.map(img => `<div class="swiper-slide"><img src="${img}" alt="${displayRef}" /></div>`).join('')}
          </div>
          <div class="swiper-pagination"></div>
        </div>` : "";

      return `
        <div class="product-card">
          ${sliderHTML}
          <h3>${displayLabel}</h3>
          <p>Prix : ${price} DT HT</p>
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

  document.querySelectorAll('.swiper').forEach((el, i) => {
    new Swiper(el, {
      pagination: { el: el.querySelector('.swiper-pagination') },
    });
  });
});
