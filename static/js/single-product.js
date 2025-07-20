document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-details");
  if (!container) {
    // console.error("Container #product-details not found in DOM");
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

  let product;
  try {
    const res = await fetch(`${API_URL}/products/${slug}`);
    product = await res.json();
    if (!product || !product.id) throw new Error("Product not found");
  } catch (err) {
    console.error("Error fetching product details:", err);
    container.innerHTML = `
      <div class="col-12 text-center">
        <h2>Product not found</h2>
        <p>The product you are looking for does not exist.</p>
        <a href="/products" class="btn btn-primary">Back to Products</a>
      </div>
    `;
    return;
  }

  const variants = await fetchVariants(product.id);

  const { name, long_description, price, images, sku, stock_levels, categories, meta_title, meta_description } = product;

  document.title = meta_title || name;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
      metaDesc.setAttribute('content', meta_description || '');
  }

  const categoryName = categories?.[0]?.name || 'Misc';
  const displayName = sku || name;

  const renderProduct = (selectedVariant) => {
    const currentVariant = selectedVariant || (variants.length > 0 ? variants[0] : null);
    const variantImages = currentVariant?.images?.length ? currentVariant.images : images;
    const totalStock = currentVariant?.stock_levels?.[0]?.quantity || stock_levels?.reduce((total, level) => total + level.quantity, 0) || 0;
    const stockDisplay = totalStock > 0 ? 'Add to cart' : 'Sold Out';
    const isSoldOut = totalStock === 0;

    const imageSlider = variantImages?.length ? variantImages.map(image => `
      <div class="swiper-slide">
        <img src="${image.cdn_url}" class="img-fluid w-100" alt="${name}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
      </div>
    `).join('') : `
      <div class="swiper-slide">
        <img src="${PLACEHOLDER_IMAGE}" class="img-fluid w-100" alt="${name}">
      </div>
    `;

    const groupedVariants = variants.length > 0 ? groupVariants(variants) : {};
    const variantSelectors = variants.length > 0 ? createVariantSelectors(groupedVariants, product.id, currentVariant) : '';

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
        <h3 class="text-primary product-price">${parseFloat(currentVariant?.price || price).toFixed(2)} DT</h3>
        <p class="product-stock">Stock: ${totalStock}</p>
        ${variantSelectors}
        <div class="mt-4" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6;">
          ${long_description || ''}
        </div>
        <button class="btn btn-warning btn-lg mt-4 add-to-cart" ${isSoldOut ? 'disabled' : ''}>
          ${stockDisplay}
        </button>
      </div>
    `;

    new Swiper('.product-image-slider', {
      autoplay: { delay: 3000 },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });

    document.querySelectorAll('.variant-selector').forEach(selector => {
      selector.addEventListener('change', (event) => {
        const selectedOptions = {};
        document.querySelectorAll(`.variant-selector[data-product-id="${product.id}"]`).forEach(s => {
          selectedOptions[s.dataset.attribute] = s.value;
        });

        const newVariant = variants.find(v =>
          Object.keys(selectedOptions).every(attr => v.attributes[attr] === selectedOptions[attr])
        );

        if (newVariant) {
          renderProduct(newVariant);
        }
      });
    });
  };

  renderProduct(variants?.[0]);
});
