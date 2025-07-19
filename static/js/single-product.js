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
      const { name, long_description, price, images, sku, stock_levels, categories, meta_title, meta_description, variants } = product;

      // Set SEO meta tags
      document.title = meta_title || name;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
          metaDesc.setAttribute('content', meta_description || '');
      }

      const categoryName = categories?.[0]?.name || 'Misc';
      const displayName = sku || name;

      const renderProduct = (selectedVariant) => {
        const variantImages = selectedVariant?.images?.length ? selectedVariant.images : images;
        const totalStock = selectedVariant?.stock_levels?.[0]?.quantity || stock_levels?.reduce((total, level) => total + level.quantity, 0) || 0;
        const stockDisplay = totalStock > 0 ? 'Add to cart' : 'Sold Out';
        const isSoldOut = totalStock === 0;

        const imageSlider = variantImages?.map(image => `
          <div class="swiper-slide">
            <img src="${image.cdn_url}" class="img-fluid w-100" alt="${name}" loading="lazy">
          </div>
        `).join('');

        const variantSelectors = variants?.length ? `
          <div class="variants mt-4">
            ${Object.keys(variants[0].attributes).map(attribute => `
              <div class="form-group">
                <label for="${attribute}">${attribute.charAt(0).toUpperCase() + attribute.slice(1)}</label>
                <select class="form-control" id="${attribute}">
                  ${[...new Set(variants.map(v => v.attributes[attribute]))].map(value => `
                    <option value="${value}" ${selectedVariant?.attributes[attribute] === value ? 'selected' : ''}>${value}</option>
                  `).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        ` : '';

        container.innerHTML = `
          <div class="col-md-6">
            <div class="swiper product-image-slider">
              <div class="swiper-wrapper">
                ${imageSlider}
              </div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>
          </div>
          <div class="col-md-6">
            <p class="text-muted">${categoryName}</p>
            <h1>${displayName}</h1>
            <h3 class="text-primary">${parseFloat(price).toFixed(2)} DT</h3>
            ${variantSelectors}
            <div class="mt-4" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6;">
              ${long_description || ''}
            </div>
            <button class="btn btn-warning btn-lg mt-4" ${isSoldOut ? 'disabled' : ''}>
              ${stockDisplay}
            </button>
          </div>
        `;

        new Swiper('.product-image-slider', {
          autoplay: {
            delay: 3000,
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
        });

        Object.keys(variants?.[0]?.attributes || {}).forEach(attribute => {
          document.getElementById(attribute)?.addEventListener('change', (event) => {
            const selectedAttributes = {};
            Object.keys(variants[0].attributes).forEach(attr => {
              selectedAttributes[attr] = document.getElementById(attr).value;
            });
            const newVariant = variants.find(v =>
              Object.keys(selectedAttributes).every(attr => v.attributes[attr] === selectedAttributes[attr])
            );
            renderProduct(newVariant);
          });
        });
      };

      renderProduct(variants?.[0]);

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
