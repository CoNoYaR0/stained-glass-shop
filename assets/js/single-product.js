document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-details");
  if (!container) {
    console.error("Container #product-details not found in DOM");
    return;
  }

  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  console.log("Parsed slug:", slug);

  container.innerHTML = `
    <div class="col-12 text-center">
      <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  `;

  try {
    const res = await fetch(`https://dolibarr-middleware.onrender.com/api/v1/products/${slug}`);
    const product = await res.json();
    console.log("API Response:", product);

    if (product && product.id) {
      const { name, long_description, price, images, sku, stock_levels, categories, meta_title, meta_description } = product;

      // Set SEO meta tags
      document.title = meta_title || name;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
          metaDesc.setAttribute('content', meta_description || '');
      }

      const imageUrl = images?.[0]?.url || 'https://cdn.stainedglass.tn/placeholder.jpg';
      const categoryName = categories?.[0]?.name || 'Misc';
      const displayName = sku || name;
      const totalStock = stock_levels?.reduce((total, level) => total + level.quantity, 0) || 0;
      const stockDisplay = totalStock > 0 ? 'Add to cart' : 'Sold Out';
      const isSoldOut = totalStock === 0;

      container.innerHTML = `
        <div class="col-md-6">
          <img src="${imageUrl}" class="img-fluid" alt="${name}">
        </div>
        <div class="col-md-6">
          <p class="text-muted">${categoryName}</p>
          <h1>${displayName}</h1>
          <h3 class="text-primary">${parseFloat(price).toFixed(2)} DT</h3>
          <div class="mt-4" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6;">
            ${long_description || ''}
          </div>
          <button class="btn btn-warning btn-lg mt-4" ${isSoldOut ? 'disabled' : ''}>
            ${stockDisplay}
          </button>
        </div>
      `;
    } else {
      console.error("Product not found or API response is empty.");
      container.innerHTML = `
        <div class="col-12 text-center">
          <h2>Product not found</h2>
          <p>The product you are looking for does not exist.</p>
          <a href="/products" class="btn btn-primary">Back to Products</a>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error fetching product details:", err);
    container.innerHTML = `
      <div class="col-12 text-center">
        <h2>Error</h2>
        <p>There was an error loading the product details.</p>
        <a href="/products" class="btn btn-primary">Back to Products</a>
      </div>
    `;
  }
});
