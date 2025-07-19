
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products-list");
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center">
      <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
    </div>
  `;

  let products = [];
  try {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    products = data.data;
    if (!Array.isArray(products)) throw new Error("Expected an array of products");
  } catch (err) {
    console.error("❌ Error loading products:", err);
    container.innerHTML = `<p>Error loading products.</p>`;
    return;
  }

  const productPromises = products.map(async prod => {
    const { id, name, slug, price, images, sku, stock_levels, categories } = prod;

    const variants = await fetchVariants(id);
    const hasVariants = variants && variants.length > 0;

    const imageSlider = (images?.length || (hasVariants && variants[0].images?.length)) ? `
      <div class="swiper product-card-swiper">
        <div class="swiper-wrapper">
          ${(hasVariants && variants[0].images?.length ? variants[0].images : images).map(image => `
            <div class="swiper-slide">
              <img src="${image.cdn_url}" class="card-img-top" alt="${name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
            </div>
          `).join('')}
        </div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    ` : `<img class="card-img-top" src="${PLACEHOLDER_IMAGE}" alt="${name}">`;

    const categoryNames = categories?.map(cat => cat.name).join(', ') || 'Misc';
    const displayName = (sku || slug || name).replace(/_/g, ' ');
    const stockDisplay = stock_levels?.[0] ? `Stock: ${stock_levels[0].quantity}` : 'Stock: N/A';

    let variantSelectorsHtml = '';
    if (hasVariants) {
      const groupedVariants = groupVariants(variants);
      variantSelectorsHtml = createVariantSelectors(groupedVariants, id);
    }

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product-card" data-product-id="${id}">
          <a href="/products/${slug}/">
            ${imageSlider}
          </a>
          <div class="card-body">
            <p class="card-text text-muted">${categoryNames}</p>
            <h4 class="card-title">
              <a href="/products/${slug}/">${displayName}</a>
            </h4>
            <h5 class="product-price">${parseFloat(price).toFixed(2)} DT</h5>
            <p class="card-text product-stock">${stockDisplay}</p>
            ${variantSelectorsHtml}
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

  const htmlPieces = await Promise.all(productPromises);
  container.innerHTML = htmlPieces.join("");

  document.querySelectorAll('.product-card-swiper').forEach(element => {
    new Swiper(element, {
      autoplay: { delay: 5000 },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  });

  document.querySelectorAll('.variant-selector').forEach(selector => {
    selector.addEventListener('change', async (event) => {
      const productId = event.target.dataset.productId;
      const variants = await fetchVariants(productId);

      const selectedOptions = {};
      document.querySelectorAll(`.variant-selector[data-product-id="${productId}"]`).forEach(s => {
        selectedOptions[s.dataset.attribute] = s.value;
      });

      const selectedVariant = variants.find(v => {
        return Object.keys(selectedOptions).every(key => {
          return v.attributes[key] === selectedOptions[key];
        });
      });

      if (selectedVariant) {
        updateProductCard(productId, selectedVariant);
      }
    });
  });

  attachAddToCartButtons();
});

function attachAddToCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");
  buttons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      console.log("Added to cart:", button.dataset.name);
    });
  });
}
