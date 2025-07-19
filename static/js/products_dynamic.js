// static/js/products_dynamic.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

  // 1) Fetch all products from the new Dolibarr middleware
  let products = [];
  try {
    const res = await fetch("https://dolibarr-middleware.onrender.com/api/v1/products");
    const data = await res.json();
    products = data.data; // The products are in the 'data' property
    if (!Array.isArray(products)) throw new Error("Expected an array of products");
    console.log("✅ Products loaded:", products);
  } catch (err) {
    console.error("❌ Error loading products:", err);
    container.innerHTML = `<p>Error loading products.</p>`;
    return;
  }

  // 2) Generate HTML for each product
  const htmlPieces = products.map(prod => {
    const { id, name, slug, price, images, sku, stock_levels, categories } = prod;

    const imageUrl = images?.[0]?.url || '/images/fallback.jpg';

    const categoryNames = categories?.map(cat => cat.name).join(', ') || 'Misc';
    const displayName = (sku || slug || name).replace(/_/g, ' ');
    const stockDisplay = stock_levels ? `Stock: ${JSON.stringify(stock_levels)}` : 'Stock: N/A';

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product-card">
          <a href="/products/${slug}/">
            <img class="card-img-top" src="${imageUrl}" alt="${name}" onerror="this.src='/images/fallback.jpg'">
          </a>
          <div class="card-body">
            <p class="card-text text-muted">${categoryNames}</p>
            <h4 class="card-title">
              <a href="/products/${slug}/">${displayName}</a>
            </h4>
            <h5>${parseFloat(price).toFixed(2)} DT</h5>
            <p class="card-text">${stockDisplay}</p>
          </div>
          <div class="card-footer">
            <button type="button" class="btn btn-warning btn-block add-to-cart" data-id="${id}" data-name="${name}" data-price="${price}" data-image="${imageUrl}">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  });

  // 3) Inject the HTML into the container
  container.innerHTML = htmlPieces.join("");

  // 4) Attach event listeners for the "Add to cart" buttons
  attachAddToCartButtons();
});

function attachAddToCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");
  buttons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      // Add to cart logic here
      console.log("Added to cart:", button.dataset.name);
    });
  });
}
