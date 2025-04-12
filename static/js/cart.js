
const CART_KEY = "customCart";

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
      const itemEl = document.createElement("div");
      itemEl.className = "cart-item mb-3";
      itemEl.innerHTML = `
  <div class="d-flex align-items-center justify-content-between mb-2">
    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: auto; object-fit: contain;" class="mr-2">
    <div class="flex-grow-1 ml-2">
      <strong>${item.name}</strong>
      <div class="d-flex align-items-center mt-1">
        <button class="btn btn-sm btn-outline-secondary decrease-qty" data-id="${item.id}">−</button>
        <span class="mx-2">${item.quantity}</span>
        <button class="btn btn-sm btn-outline-secondary increase-qty" data-id="${item.id}">+</button>
      </div>
    </div>
    <div class="text-right">
      <small>${(item.price * item.quantity).toFixed(2)} TND</small><br>
      <button class="btn btn-sm btn-danger mt-1 remove-item" data-id="${item.id}">×</button>
    </div>
  </div>
  <hr>
`;
      container.appendChild(itemEl);
      total += item.quantity * item.price;
    });

    totalEl.textContent = total.toFixed(2);

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
          url: button.dataset.url || "",
          colorOptions: button.dataset.colorOptions?.split("|") || [],
          sizeOptions: button.dataset.sizeOptions?.split("|") || [],
        };

        
      // 💥 Bounce animation
      button.classList.add("bounce");
      setTimeout(() => button.classList.remove("bounce"), 400);

      addToCart(product);
      });
    });
  }

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
});
