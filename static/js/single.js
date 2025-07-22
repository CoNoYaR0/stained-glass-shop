document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://dolibarr-middleware.onrender.com/api/v1';
    const CDN_BASE_URL = 'https://cdn.stainedglass.tn';
    const FALLBACK_IMAGE = `${CDN_BASE_URL}/images/fallback.jpg`;

    const productContainer = document.querySelector('.product-single-container');
    const loadingIndicator = document.getElementById('loading');
    const errorContainer = document.getElementById('error');
    const mainImage = document.getElementById('main-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    const productTitle = document.getElementById('product-title');
    const productSubtitle = document.getElementById('product-subtitle');
    const productCategory = document.getElementById('product-category');
    const productDescription = document.getElementById('product-description');
    const productPrice = document.getElementById('product-price');
    const productStock = document.getElementById('product-stock');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const productDetailsContainer = document.getElementById('product-details');

    let currentProduct = null;

    const getSkuFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sku');
    };

    const fetchProduct = async () => {
        try {
            loadingIndicator.style.display = 'block';
            if (productDetailsContainer) productDetailsContainer.style.display = 'none';
            errorContainer.style.display = 'none';

            const sku = getSkuFromUrl();
            if (!sku) {
                throw new Error('Product SKU not found in URL.');
            }

            // First, get the product by SKU
            const searchUrl = `${API_BASE_URL}/products/search?q=${sku}`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
            }
            const searchResults = await searchResponse.json();
            if (!searchResults || !searchResults.data || searchResults.data.length === 0) {
                throw new Error('Product not found.');
            }
            const productBySku = searchResults.data[0];

            // Then, get the full product details with relations by ID
            const productUrl = `${API_BASE_URL}/products/${productBySku.id}`;
            const productResponse = await fetch(productUrl);
            if (!productResponse.ok) {
                throw new Error(`HTTP error! status: ${productResponse.status}`);
            }

            const rawProduct = await productResponse.json();
            currentProduct = mapProduct(rawProduct);
            renderProduct();

        } catch (err) {
            showError(err.message);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };

    const mapProduct = (raw) => {
        const cdnUrl = (path) => (path && path.startsWith('/')) ? `${CDN_BASE_URL}${path}` : path;

        const images = [];
        if (raw.thumbnail_url) {
            images.push(cdnUrl(raw.thumbnail_url));
        }
        if (raw.photos && raw.photos.length) {
            raw.photos.forEach(p => images.push(cdnUrl(p.url)));
        }

        return {
            id: raw.id,
            sku: raw.sku,
            name: raw.name,
            category: raw.category ? raw.category.name : 'Uncategorized',
            price: Math.round(raw.price || 0),
            stock: raw.stock || 0,
            description: raw.description,
            images: images.length > 0 ? [...new Set(images)] : [FALLBACK_IMAGE],
        };
    };

    const renderProduct = () => {
        if (!currentProduct) return;

        productTitle.textContent = currentProduct.sku.replace(/_/g, ' ');
        productSubtitle.textContent = currentProduct.name;
        productCategory.textContent = currentProduct.category;
        productDescription.innerHTML = currentProduct.description;
        productPrice.textContent = `${currentProduct.price} TND`;

        mainImage.src = currentProduct.images[0];

        renderStock();
        renderGallery();

        addToCartBtn.onclick = () => {
            if (currentProduct.stock > 0) {
                // Add to cart logic here
                console.log('Adding to cart:', currentProduct);
            }
        };

        if (productDetailsContainer) productDetailsContainer.style.display = 'flex';
    };

    const renderStock = () => {
        if (currentProduct.stock > 0) {
            productStock.textContent = `${currentProduct.stock} in stock`;
            productStock.classList.remove('out-of-stock');
            addToCartBtn.disabled = false;
        } else {
            productStock.textContent = 'Out of stock';
            productStock.classList.add('out-of-stock');
            addToCartBtn.disabled = true;
        }
    };

    const renderGallery = () => {
        thumbnailGallery.innerHTML = '';
        if (currentProduct.images.length > 1) {
            currentProduct.images.forEach((imageUrl, index) => {
                const thumb = document.createElement('img');
                thumb.src = imageUrl;
                thumb.classList.add('thumbnail');
                if (index === 0) {
                    thumb.classList.add('selected');
                }
                thumb.onclick = () => {
                    mainImage.src = imageUrl;
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
                    thumb.classList.add('selected');
                };
                thumbnailGallery.appendChild(thumb);
            });
        }
    };

    const showError = (message) => {
        errorContainer.textContent = `Error: ${message}`;
        errorContainer.style.display = 'block';
        if (productDetailsContainer) productDetailsContainer.style.display = 'none';
    };

    fetchProduct();
});
