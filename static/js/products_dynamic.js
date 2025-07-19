document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");
  if (!container) {
    // If the container doesn't exist, do nothing.
    return;
  }
  container.innerHTML = `
    <div class="col-12 text-center">
      <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  `;

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

    const imageSlider = images?.length ? `
      <div class="swiper product-card-swiper">
        <div class="swiper-wrapper">
          ${images.map(image => `
            <div class="swiper-slide">
              <img src="${image.cdn_url}" class="card-img-top" alt="${name}" loading="lazy" onerror="this.src='https://cdn.stainedglass.tn/placeholder.jpg'">
            </div>
          `).join('')}
        </div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    ` : `<img class="card-img-top" src="https://cdn.stainedglass.tn/placeholder.jpg" alt="${name}">`;

    const categoryNames = categories?.map(cat => cat.name).join(', ') || 'Misc';
    const displayName = (sku || slug || name).replace(/_/g, ' ');
    const stockDisplay = stock_levels?.[0] ? `Stock: ${stock_levels[0].quantity}` : 'Stock: N/A';

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product-card">
          <a href="/products/${slug}/">
            ${imageSlider}
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
            <button type="button" class="btn btn-warning btn-block add-to-cart" data-id="${id}" data-name="${name}" data-price="${price}" data-image="${images?.[0]?.cdn_url || ''}">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  });

  // 3) Inject the HTML into the container
  container.innerHTML = htmlPieces.join("");

  // 4) Initialize Swiper
  document.querySelectorAll('.product-card-swiper').forEach(element => {
    new Swiper(element, {
      autoplay: {
        delay: 5000,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  });

  // 5) Attach event listeners for the "Add to cart" buttons
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
