const CART_KEY = "customCart";

function attachAddToCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");

  if (buttons.length === 0) {
    setTimeout(attachAddToCartButtons, 300);
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      const product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image || "",
        quantity: 1
      };

      button.classList.add("bounce");
      setTimeout(() => button.classList.remove("bounce"), 400);

      addToCart(product);
    });
  });
}

async function loadDolibarrProducts() {
  try {
    const response = await fetch('/.netlify/functions/sync-products');
    const data = await response.json();

    if (data.success && data.products.length > 0) {
      const productsContainer = document.getElementById('products-container');

      if (!productsContainer) {
        console.error("⚠️ Container produits non trouvé !");
        return;
      }

      productsContainer.innerHTML = '';

      data.products.forEach(product => {
        const productHTML = `
          <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.price.toFixed(2)} TND</p>
            <button 
              class="add-to-cart" 
              data-id="${product.id}" 
              data-name="${product.name}"
              data-price="${product.price}" 
              data-image="${product.image}"
              ${product.stock === 0 ? 'disabled' : ''}
            >
              ${product.stock === 0 ? 'Sold Out' : 'Ajouter au panier'}
            </button>
          </div>
        `;

        productsContainer.innerHTML += productHTML;
      });

      attachAddToCartButtons();
    }
  } catch (error) {
    console.error("Erreur chargement produits Dolibarr:", error);
  }
}

// Reste du code DOMContentLoaded (inchangé)
document.addEventListener("DOMContentLoaded", function () {
  if (!localStorage.getItem(CART_KEY)) {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
  }

  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElem = document.getElementById("cart-count");
    if (countElem) countElem.textContent = total;
  }

  function renderCartItems() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    const container = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");

    if (!cart.length) {
      container.innerHTML = '<p class="text-muted">Votre panier est vide.</p>';
      totalEl.textContent = "0.00";
      return;
    }

    container.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.quantity * item.price;
      container.innerHTML += `
        <div class="cart-item mb-3">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-details">
            <div class="cart-header-line">
              <span class="cart-name">${item.name}</span>
              <span class="cart-price">${(item.price * item.quantity).toFixed(2)} TND</span>
              <button class="remove-item" data-id="${item.id}">×</button>
            </div>
            <div class="quantity-control">
              <button class="decrease-qty" data-id="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button class="increase-qty" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `;
    });

    totalEl.textContent = total.toFixed(2);

    attachCartItemButtons();
  }

  function attachCartItemButtons() {
    const container = document.getElementById("cart-items");

    container.querySelectorAll(".increase-qty").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        const item = cart.find(p => p.id === id);
        if (item) item.quantity += 1;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
      });
    });

    container.querySelectorAll(".decrease-qty").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        let cart = JSON.parse(localStorage.getItem(CART_KEY));
        const item = cart.find(p => p.id === id);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(p => p.id !== id);
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
      });
    });

    container.querySelectorAll(".remove-item").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        let cart = JSON.parse(localStorage.getItem(CART_KEY));
        cart = cart.filter(p => p.id !== id);
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
      });
    });
  }

  loadDolibarrProducts();
  attachAddToCartButtons();
  updateCartCount();

  const openCartBtn = document.getElementById("open-cart");
  const closeCartBtn = document.getElementById("close-cart");
  const cartPanel = document.getElementById("custom-cart-panel");

  if (openCartBtn && closeCartBtn && cartPanel) {
    openCartBtn.addEventListener("click", () => {
      cartPanel.classList.remove("hidden");
      cartPanel.classList.add("visible");
      renderCartItems();
    });

    closeCartBtn.addEventListener("click", () => {
      cartPanel.classList.remove("visible");
      cartPanel.classList.add("hidden");
    });
  }

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/checkout/";
    });
  }

  const checkoutButton = document.getElementById("checkout-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("➡️ Redirection vers /checkout/");
      window.location.href = "/checkout/";
    });
  } else {
    console.warn("🛑 #checkout-button non trouvé");
  }
});