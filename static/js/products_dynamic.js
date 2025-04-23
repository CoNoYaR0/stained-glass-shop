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

    container.innerHTML = products.map(prod => `
      <div style="margin-bottom: 1rem;">
        <strong>${prod.ref || prod.label}</strong><br>
        Prix : ${parseFloat(prod.price).toFixed(2)} DT HT<br>
        Stock : ${prod.stock_reel ?? 'N/A'}
        <hr>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "<p>Erreur de chargement des produits</p>";
    console.error(err);
  }
});
