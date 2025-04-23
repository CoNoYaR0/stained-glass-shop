document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");
  if (!container) return;

  try {
    const res = await fetch("https://proxy-dolibarr-production.up.railway.app/products");
    const products = await res.json();

    console.log("📦 Produits chargés :", products);

    products.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card";

      const title = document.createElement("h3");
      title.textContent = prod.ref;
      card.appendChild(title);

      const price = document.createElement("p");
      price.textContent = `Prix : ${parseFloat(prod.price).toFixed(2)} DT HT`;
      card.appendChild(price);

      const stock = document.createElement("p");
      stock.textContent = `Stock : ${prod.stock_reel ?? "N/A"}`;
      card.appendChild(stock);

      const btn = document.createElement("button");
      btn.textContent = "Ajouter au panier";
      card.appendChild(btn);

      // 🔥 Forced display for testing
      const testImg = document.createElement("img");
      testImg.src = "https://www.stainedglass.tn/stainedglass-cdn/products/Assiette_artistique_en_Verre_Fusing_Artisanale_2/Assiette_artistique_en_Verre_Fusing_Artisanale_2-showcase-4.png";
      testImg.style.width = "100px";
      card.appendChild(testImg);

      // 🔍 Dynamic search
      const ref = prod.ref;
      const imgBase = `https://www.stainedglass.tn/stainedglass-cdn/products/${ref}/${ref}`;
      const extensions = ["png", "jpg", "jpeg", "webp"];

      let found = false;
      (async () => {
        for (let i = 1; i <= 6; i++) {
          for (const ext of extensions) {
            const url = `${imgBase}-showcase-${i}.${ext}`;
            console.log("🔍 Test image:", url);
            try {
              const imgRes = await fetch(url, { method: "HEAD" });
              if (imgRes.ok) {
                const img = document.createElement("img");
                img.src = url;
                img.style.width = "100px";
                card.appendChild(img);
                found = true;
                break;
              }
            } catch (e) {
              console.warn("❌ Fetch failed:", url);
            }
          }
          if (found) break;
        }
      })();

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur de chargement des produits :", err);
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
  }
});