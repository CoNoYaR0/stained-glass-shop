// static/js/products_dynamic.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");

  // 1) Fetch all products and categories from the new Dolibarr middleware
  let products = [];
  let categories = [];
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch("https://dolibarr-middleware.onrender.com/api/v1/products"),
      fetch("https://dolibarr-middleware.onrender.com/api/v1/categories")
    ]);
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    products = productsData.data;
    categories = categoriesData.data;

    if (!Array.isArray(products)) throw new Error("Expected an array of products");
    if (!Array.isArray(categories)) throw new Error("Expected an array of categories");

    console.log("✅ Products loaded:", products);
    console.log("✅ Categories loaded:", categories);
  } catch (err) {
    console.error("❌ Error loading data:", err);
    container.innerHTML = `<p>Error loading products.</p>`;
    return;
  }

  const categoryMap = new Map(categories.map(cat => [cat.dolibarr_category_id, cat.name]));
  console.log("Category Map:", categoryMap);

  // 2) Generate HTML for each product
  const htmlPieces = products.map(prod => {
    const { id, name, slug, price, images, thumbnail_url, category_id, sku } = prod;
    console.log("Product Category ID:", category_id);


    const thumbnailUrl =
      images?.find(img => img.type === 'thumbnail')?.url ||
      thumbnail_url ||
      '/images/fallback.jpg';

    const categoryName = categoryMap.get(category_id) || 'Misc';
    const displayName = (sku || slug).replace(/_/g, ' ');

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product-card">
          <a href="/products/${slug}/">
            <img class="card-img-top" src="${thumbnailUrl}" alt="${name}" onerror="this.src='/images/fallback.jpg'">
          </a>
          <div class="card-body">
            <p class="card-text text-muted">${categoryName}</p>
            <h4 class="card-title">
              <a href="/products/${slug}/">${displayName}</a>
            </h4>
            <h5>${parseFloat(price).toFixed(2)} DT</h5>
          </div>
          <div class="card-footer">
            <button type="button" class="btn btn-warning btn-block add-to-cart" data-id="${id}" data-name="${name}" data-price="${price}" data-image="${thumbnailUrl}">
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
