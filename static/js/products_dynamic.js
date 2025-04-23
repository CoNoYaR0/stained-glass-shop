document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('product-list');
  if (!container) return;

  try {
    const response = await fetch('https://proxy-dolibarr-production.up.railway.app/products');
    const products = await response.json();

    if (!Array.isArray(products)) {
      container.innerHTML = "<p>Erreur de format de données</p>";
      return;
    }

    container.innerHTML = products.map(prod => {
      const name = prod.ref || prod.label || "Nom inconnu";
      const price = isNaN(parseFloat(prod.price)) ? "?" : parseFloat(prod.price).toFixed(2);
      const stock = prod.stock_reel ?? 'N/A';

      return `
        <div style="margin-bottom: 1rem;">
          <strong>${name}</strong><br>
          Prix : ${price} DT HT<br>
          Stock : ${stock}
          <hr>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
    console.error(err);
  }
});
