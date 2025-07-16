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
    const { id, name, slug, price, thumbnail_url } = prod;
    const stock = "N/A"; // Stock information is not available in the new API

    const imageUrl = thumbnail_url || '/images/fallback.jpg';

    // Slider HTML for the product image
    const sliderHTML = `
      <div class="swiper swiper-${id}">
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <img src="${imageUrl}"
                 alt="${name}"
                 onerror="this.src='/img/fallback.jpg'"
                 class="w-100" />
          </div>
        </div>
        <div class="swiper-pagination"></div>
      </div>`;

    // Product card HTML
    return `
      <a href="/products/${slug}/"
         class="product-card-link d-block text-decoration-none mb-4"
         style="width: 100%; max-width: 360px;">
        <div class="card h-100 border-warning">
          ${sliderHTML}
          <div class="card-body">
            <h5 class="card-title">${name}</h5>
            <p class="card-text mb-1">Price: ${parseFloat(price).toFixed(2)} DT HT</p>
            <p class="card-text mb-2">Stock: ${stock}</p>
            <button type="button"
                    class="add-to-cart btn btn-warning mt-3"
                    data-id="${id}"
                    data-name="${name}"
                    data-price="${price}"
                    data-image="${imageUrl}">
              Add to cart
            </button>
          </div>
        </div>
      </a>`;
  });

  // 3) Inject the HTML into the container
  container.innerHTML = htmlPieces.join("");

  // 4) Attach event listeners for the "Add to cart" buttons
  attachAddToCartButtons();

  // 5) Initialize Swiper sliders
  setTimeout(() => {
    document.querySelectorAll('.swiper').forEach(el => {
      new Swiper(el, {
        pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
        loop: false
      });
    });
  }, 100);
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
