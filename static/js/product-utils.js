const API_URL = "https://dolibarr-middleware.onrender.com/api/v1";
const PLACEHOLDER_IMAGE = "https://cdn.stainedglass.tn/placeholder.jpg";
const variantCache = new Map();

async function fetchVariants(productId) {
  if (variantCache.has(productId)) {
    return variantCache.get(productId);
  }
  try {
    const res = await fetch(`${API_URL}/products/${productId}/variants`);
    if (!res.ok) throw new Error(`Failed to fetch variants for product ${productId}`);
    const data = await res.json();
    const variants = data.data || [];
    variantCache.set(productId, variants);
    return variants;
  } catch (err) {
    console.error(`❌ Error fetching variants for product ${productId}:`, err);
    return [];
  }
}

function groupVariants(variants) {
  const grouped = {};
  variants.forEach(variant => {
    const { attributes } = variant;
    if (!attributes) return;

    Object.keys(attributes).forEach(key => {
      if (!grouped[key]) {
        grouped[key] = new Set();
      }
      grouped[key].add(attributes[key]);
    });
  });

  Object.keys(grouped).forEach(key => {
    grouped[key] = Array.from(grouped[key]);
  });

  return grouped;
}

function createVariantSelectors(groupedVariants, productId, selectedVariant) {
  let selectorsHtml = '';
  Object.keys(groupedVariants).forEach(key => {
    const values = groupedVariants[key];
    selectorsHtml += `
      <div class="form-group">
        <label for="variant-${key}-${productId}">${key.charAt(0).toUpperCase() + key.slice(1)}:</label>
        <select class="form-control variant-selector" data-attribute="${key}" data-product-id="${productId}">
          ${values.map(value => `<option value="${value}" ${selectedVariant?.attributes[key] === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </div>
    `;
  });
  return selectorsHtml;
}
