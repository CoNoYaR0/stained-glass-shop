// products-dynamic.js
window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-list");
  const products = window.__PRODUCTS__ || [];

  for (const product of products) {
    const productCard = document.createElement("div");
    productCard.className = "col-md-4 col-sm-6 mb-4";

    // Conteneur images dynamiques
    const imgContainer = document.createElement("div");
    imgContainer.className = "d-flex flex-wrap mb-3";

    try {
      const imgRes = await fetch(`/images/products/${product.ref}/`);
      const html = await imgRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const links = [...doc.querySelectorAll("a")];
      const images = links
        .map(a => a.getAttribute("href"))
        .filter(href => href.endsWith(".png|jpg|jpeg|webp|gif"));

      images.forEach(src => {
        const img = document.createElement("img");
        img.src = `/images/products/${product.ref}/${src}`;
        img.alt = product.name;
        img.style.maxWidth = "100px";
        img.className = "mr-2 mb-2 border rounded";
        imgContainer.appendChild(img);
      });
    } catch (e) {
      console.warn("Pas d'images trouvées pour", product.ref);
    }

    productCard.innerHTML = `
      <div class="card h-100">
        <div class="card-body text-center">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">${product.price.toFixed(3)} TND</p>
          <button class="btn btn-outline-dark snipcart-add-item"
            data-item-id="${product.ref}"
            data-item-name="${product.name}"
            data-item-price="${product.price}"
            data-item-url="/products/"
            data-item-description="${product.name}">
            Ajouter au panier
          </button>
        </div>
      </div>
    `;

    productCard.querySelector(".card-body").prepend(imgContainer);
    container.appendChild(productCard);
  }
});
