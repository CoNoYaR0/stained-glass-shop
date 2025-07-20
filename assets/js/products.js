async function getProducts() {
  try {
    const response = await fetch('https://dolibarr-middleware.onrender.com/api/v1/products');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function getVariantSelector(variant) {
  let selector = '';
  if (variant.attribute_type === 'color') {
    selector = `
      <div class="color-picker">
        <label>${variant.name}</label>
        <div class="colors">
          ${variant.values.map(value => `
            <div class="color" style="background-color: ${value.value}" data-value="${value.id}"></div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (variant.attribute_type === 'dimension') {
    selector = `
      <div class="dimension-picker">
        <label>${variant.name}</label>
        <select class="form-control">
          ${variant.values.map(value => `
            <option value="${value.id}">${value.value}</option>
          `).join('')}
        </select>
      </div>
    `;
  }
  return selector;
}
