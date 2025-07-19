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

    const imageCarousel = images && images.length > 0 ? `
      <div id="carousel-${id}" class="carousel slide" data-ride="carousel">
        <ol class="carousel-indicators">
          ${images.map((_, index) => `
            <li data-target="#carousel-${id}" data-slide-to="${index}" class="${index === 0 ? 'active' : ''}"></li>
          `).join('')}
        </ol>
        <div class="carousel-inner">
          ${images.map((img, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
              <img src="${img.url}" class="d-block w-100" alt="${name}">
            </div>
          `).join('')}
        </div>
        <a class="carousel-control-prev" href="#carousel-${id}" role="button" data-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="sr-only">Previous</span>
        </a>
        <a class="carousel-control-next" href="#carousel-${id}" role="button" data-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="sr-only">Next</span>
        </a>
      </div>
    ` : `
      <img class="card-img-top" src="/images/fallback.jpg" alt="${name}">
    `;

    const categoryNames = categories?.map(cat => cat.name).join(', ') || 'Misc';
    const displayName = (sku || slug || name).replace(/_/g, ' ');
    const totalStock = stock_levels?.reduce((total, level) => total + level.quantity, 0) || 0;
    const stockDisplay = totalStock === 0 ? '<span class="badge badge-danger">Sold Out</span>' : `Stock: ${totalStock}`;

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product-card">
          ${imageCarousel}
          <div class="card-body">
            <p class="card-text text-muted">${categoryNames}</p>
            <h4 class="card-title">
              <a href="/products/${slug}/">${displayName}</a>
            </h4>
            <h5>${parseFloat(price).toFixed(2)} DT</h5>
            <p class="card-text">${stockDisplay}</p>
          </div>
          <div class="card-footer">
            <button type="button" class="btn btn-warning btn-block add-to-cart" data-id="${id}" data-name="${name}" data-price="${price}" data-image="${images?.[0]?.url || '/images/fallback.jpg'}" ${totalStock === 0 ? 'disabled' : ''}>
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
