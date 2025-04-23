
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('products-list');
  if (!container) return;

  try {
    const response = await fetch('https://proxy-dolibarr-production.up.railway.app/products');
    const products = await response.json();

    console.log("🔍 Produits reçus :", products); // <-- Debug ici

    if (!Array.isArray(products)) {
      container.innerHTML = "<p>Erreur de format de données</p>";
      return;
    }

    container.innerHTML = products.map(prod => {
      const name = prod.ref || prod.label || "Nom inconnu";
      const price = isNaN(parseFloat(prod.price)) ? "?" : parseFloat(prod.price).toFixed(2);
      const stock = prod.stock_reel ?? 'N/A';
      const id = prod.id || prod.ref || name;

      return `
        <div class="product-card" style="border: 2px solid #0088cc; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; box-shadow: 0 0 15px rgba(0,0,0,0.05);">
          <h4 style="font-weight: bold; color: #333;">${name}</h4>
          <p style="margin: 0;">Prix : ${price} DT HT</p>
          <p style="margin: 0;">Stock : ${stock}</p>
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
  } catch (err) {
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
    console.error(err);
  }
});
