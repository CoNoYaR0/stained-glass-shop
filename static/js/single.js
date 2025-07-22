document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    const API_URL = 'https://dolibarr-middleware.onrender.com/api/v1/products';
    const HEALTH_CHECK_URL = 'https://dolibarr-middleware.onrender.com/health';

    // DOM Elements
    const productDetailsContainer = document.getElementById('product-details');
    const loadingIndicator = document.getElementById('loading');
    const errorContainer = document.getElementById('error');
    const mainImage = document.getElementById('main-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    const productTitle = document.getElementById('product-title');
    const productTags = document.getElementById('product-tags');
    const productDescription = document.getElementById('product-description');
    const productPrice = document.getElementById('product-price');
    const productStock = document.getElementById('product-stock');
    const variantSelectorContainer = document.getElementById('variant-selector');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    let productData = null;
    let variants = [];

    /**
     * Fetches product data from the API.
     * @param {string} sku - The product SKU to fetch.
     */
    const fetchProduct = async (sku) => {
        console.log(`Fetching product with SKU: ${sku}`);
        try {
            loadingIndicator.style.display = 'block';
            productDetailsContainer.style.display = 'none';
            errorContainer.style.display = 'none';

            const fetchUrl = `${API_URL}?sku=${sku}`;
            console.log('Fetching product from:', fetchUrl);
            const response = await fetch(fetchUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('API response:', data);


            if (!data || data.length === 0) {
                throw new Error('Product not found.');
            }

            productData = data[0];
            variants = data; // All returned items are variants
            renderProduct();

        } catch (err) {
            console.error('Error fetching product:', err);
            showError(err.message);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };

    /**
     * Renders the fetched product data on the page.
     */
    const renderProduct = () => {
        console.log('Rendering product:', productData);
        const defaultVariant = variants[0];

        // Clean and set title
        const cleanedSku = defaultVariant.sku.replace(/_C\d+$/, '').replace(/[_-]/g, ' ');
        productTitle.textContent = cleanedSku;
        document.title = cleanedSku; // Update page title

        // Set tags/categories
        productTags.textContent = defaultVariant.categories.map(c => c.label).join(', ') || 'Uncategorized';

        // Set description
        productDescription.innerHTML = defaultVariant.description;

        // Render gallery
        renderGallery(defaultVariant.images);

        // Render variants
        if (variants.length > 1) {
            renderVariantSelector();
            // Select the first variant by default
            updateVariant(variants[0].id);
        } else {
            // If only one product, treat it as the single variant
            updateVariant(defaultVariant.id);
        }

        productDetailsContainer.style.display = 'flex';
        attachAddToCartButtons(); // Attach cart logic from external script
    };

    /**
     * Renders the image gallery.
     * @param {Array} images - Array of image objects.
     */
    const renderGallery = (images) => {
        console.log('Rendering gallery with images:', images);
        const fallbackImage = 'https://via.placeholder.com/400';
        mainImage.src = images.length > 0 ? images[0].url : fallbackImage;

        thumbnailGallery.innerHTML = '';
        if (images.length > 1) {
            images.forEach((image, index) => {
                const thumb = document.createElement('img');
                thumb.src = image.url;
                thumb.alt = `Thumbnail ${index + 1}`;
                thumb.classList.add('thumbnail');
                if (index === 0) thumb.classList.add('selected');

                thumb.addEventListener('click', () => {
                    mainImage.src = image.url;
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
                    thumb.classList.add('selected');
                });
                thumbnailGallery.appendChild(thumb);
            });
        }
    };

    /**
     * Renders the variant selector (color swatches or dropdown).
     */
    const renderVariantSelector = () => {
        console.log('Rendering variant selector');
        const attributeType = variants[0].attributeType;
        variantSelectorContainer.innerHTML = ''; // Clear previous options

        const label = document.createElement('label');
        label.textContent = `Select ${attributeType || 'Option'}:`;
        variantSelectorContainer.appendChild(label);

        if (attributeType === 'Color') {
            const swatchesContainer = document.createElement('div');
            swatchesContainer.className = 'color-swatches';
            variants.forEach(variant => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = variant.attributeValue;
                swatch.dataset.variantId = variant.id;
                swatch.title = variant.attributeValue;

                swatch.addEventListener('click', () => {
                    updateVariant(variant.id);
                    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                    swatch.classList.add('selected');
                });
                swatchesContainer.appendChild(swatch);
            });
            variantSelectorContainer.appendChild(swatchesContainer);
        } else {
            const select = document.createElement('select');
            select.className = 'variant-select';
            variants.forEach(variant => {
                const option = document.createElement('option');
                option.value = variant.id;
                option.textContent = variant.attributeValue || variant.sku;
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => updateVariant(e.target.value));
            variantSelectorContainer.appendChild(select);
        }
    };

    /**
     * Updates the UI with the selected variant's data.
     * @param {string} variantId - The ID of the selected variant.
     */
    const updateVariant = (variantId) => {
        console.log(`Updating variant to ID: ${variantId}`);
        const selectedVariant = variants.find(v => v.id == variantId);
        if (!selectedVariant) {
            console.error(`Variant with ID ${variantId} not found.`);
            return;
        }

        // Update Price
        productPrice.textContent = `${Math.round(selectedVariant.price)} TND`;

        // Update Stock
        const stock = selectedVariant.stock;
        if (stock > 0) {
            productStock.textContent = `${stock} in stock`;
            productStock.className = 'product-stock';
            addToCartBtn.disabled = false;
        } else {
            productStock.textContent = 'Out of stock';
            productStock.className = 'product-stock out-of-stock';
            addToCartBtn.disabled = true;
        }

        // Update Add to Cart button data attributes
        addToCartBtn.dataset.id = selectedVariant.id;
        addToCartBtn.dataset.name = productTitle.textContent; // Use cleaned title
        addToCartBtn.dataset.price = selectedVariant.price;
        addToCartBtn.dataset.image = selectedVariant.images.length > 0 ? selectedVariant.images[0].url : mainImage.src;
    };

    /**
     * Displays an error message.
     * @param {string} message - The error message to display.
     */
    const showError = (message) => {
        console.error(`Displaying error: ${message}`);
        errorContainer.textContent = `Error: ${message}`;
        errorContainer.style.display = 'block';
        productDetailsContainer.style.display = 'none';
    };

    /**
     * Dummy function placeholder for external cart logic.
     * This function should be defined in your global scripts.
     */
    const attachAddToCartButtons = () => {
        if (window.attachAddToCartButtons) {
            window.attachAddToCartButtons();
        } else {
            console.warn('attachAddToCartButtons function not found. Cart functionality might not work.');
            // Basic fallback for demonstration
            addToCartBtn.addEventListener('click', () => {
                if (addToCartBtn.disabled) return;
                alert(`Added to cart:
                    ID: ${addToCartBtn.dataset.id}
                    Name: ${addToCartBtn.dataset.name}
                    Price: ${addToCartBtn.dataset.price} TND`);
            });
        }
    };

    /**
     * Keep-alive ping to prevent the backend from sleeping.
     */
    const keepAlive = () => {
        console.log('Starting keep-alive ping');
        setInterval(() => {
            console.log('Pinging health check URL');
            fetch(HEALTH_CHECK_URL).catch(err => console.error('Keep-alive ping failed:', err));
        }, 10 * 60 * 1000); // 10 minutes
    };

    // --- Initialization ---
    console.log('Initializing single product page script');
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('sku');
    console.log(`Parsed SKU from URL: ${sku}`);

    if (sku) {
        fetchProduct(sku);
    } else {
        showError('No product SKU provided in the URL.');
    }

    keepAlive();
});
