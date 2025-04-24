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

      // ✅ Image unique pour chaque produit
      const ref = prod.ref;
      const imageUrl = `https://www.stainedglass.tn/stainedglass-cdn/products/${ref}/${ref}-showcase-1.png`;

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = prod.label;
      img.style.width = "100%";
      img.style.borderRadius = "8px";
      img.onerror = () => img.remove(); // remove image if it fails
      card.appendChild(img);

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur de chargement des produits :", err);
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
  }
});