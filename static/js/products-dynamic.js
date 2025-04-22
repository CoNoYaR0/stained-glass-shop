document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-list");

  try {
    const response = await fetch("/products.json");
    const products = await response.json();

    if (!Array.isArray(products)) throw new Error("Invalid products format");

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "col-lg-4 col-md-6 mb-4";

      const imgContainer = document.createElement("div");
      imgContainer.className = "card h-100";

      // Load product image if exists
      const image = new Image();
      image.loading = "lazy";
      image.src = `/images/products/${product.ref}/1.png`;
      image.alt = product.name;
      image.onerror = () => {
        image.style.display = "none";
      };

      imgContainer.appendChild(image);

      // Product info
      productCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">${Number(product.price).toFixed(3)} TND</p>
          <button class="btn btn-outline-dark snipcart-add-item"
            data-item-id="${product.ref}"
            data-item-name="${product.name}"
            data-item-price="${Number(product.price).toFixed(3)}"
            data-item-url="/products"
            data-item-description="${product.name}">
            Ajouter au panier
          </button>
        </div>
      `;

      productCard.querySelector(".card-body").prepend(imgContainer);
      container.appendChild(productCard);
    });
  } catch (err) {
    console.error("❌ Impossible de charger les produits :", err);
  }
});