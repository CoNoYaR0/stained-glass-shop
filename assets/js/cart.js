if (typeof window.CART_JS_INITIALIZED === 'undefined') {
  window.CART_JS_INITIALIZED = true;

  const CART_KEY = "customCart";
  const MAX_RETRIES = 5;
  let retryCount = 0;

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      console.warn("Could not access localStorage. Cart functionality will be limited.", e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not access localStorage. Cart not saved.", e);
    }
  }

  function addToCart(product) {
    const cart = getCart();
    if (product.id && typeof product.id === 'string') {
      product.id = product.id.trim();
    }
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }

    saveCart(cart);
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElem = document.getElementById("cart-count");
    if (countElem) {
      countElem.textContent = total;
    } else {
      console.warn("#cart-count element not found.");
    }
  }

  function attachAddToCartButtons() {
    const buttons = document.querySelectorAll(".add-to-cart");

    if (buttons.length === 0) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(attachAddToCartButtons, 300);
      } else {
        console.warn(".add-to-cart buttons not found after multiple retries.");
      }
      return;
    }

    buttons.forEach((button) => {
      if (button.dataset.listenerAttached === 'true') return;
      button.dataset.listenerAttached = 'true';

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const product = {
          id: button.dataset.id ? button.dataset.id.trim() : '',
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

  function initializeCart() {
    try {
      if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn("Could not initialize localStorage for cart.", e);
    }

    function renderCartItems() {
      const cart = getCart();
      console.log("🛒 Cart contents:", cart);
      const container = document.getElementById("cart-items");
      const totalEl = document.getElementById("cart-total");

      if (!container || !totalEl) {
        console.warn("Cart container or total element not found. Skipping cart rendering.");
        return;
      }

      if (!cart || !cart.length) {
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
      if (!container) return;

      container.querySelectorAll(".increase-qty").forEach(button => {
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
        button.addEventListener("click", () => {
          const id = button.dataset.id ? button.dataset.id.trim() : '';
          const cart = getCart();
          const item = cart.find(p => p.id === id);
          if (item) item.quantity += 1;
          saveCart(cart);
          updateCartCount();
          renderCartItems();
        });
      });

      container.querySelectorAll(".decrease-qty").forEach(button => {
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
        button.addEventListener("click", () => {
          const id = button.dataset.id ? button.dataset.id.trim() : '';
          let cart = getCart();
          const item = cart.find(p => p.id === id);
          if (item && item.quantity > 1) {
            item.quantity -= 1;
          } else {
            cart = cart.filter(p => p.id !== id);
          }
          saveCart(cart);
          updateCartCount();
          renderCartItems();
        });
      });

      container.querySelectorAll(".remove-item").forEach(button => {
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
        button.addEventListener("click", () => {
          const id = button.dataset.id ? button.dataset.id.trim() : '';
          let cart = getCart();
          cart = cart.filter(p => p.id !== id);
          saveCart(cart);
          updateCartCount();
          renderCartItems();
        });
      });
    }

    updateCartCount();

    const openCartBtn = document.getElementById("open-cart");
    const closeCartBtn = document.getElementById("close-cart");
    const cartPanel = document.getElementById("custom-cart-panel");

    if (openCartBtn && closeCartBtn && cartPanel) {
      openCartBtn.addEventListener("click", () => {
        cartPanel.classList.add("visible");
        renderCartItems();
      });

      closeCartBtn.addEventListener("click", () => {
        cartPanel.classList.remove("visible");
      });
    } else {
      console.warn("Cart panel elements not found.");
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
    }

    attachAddToCartButtons();

    // ✅ Ajout d'un log clair quand le panier est chargé
    console.log("%c✔️ Cart loaded successfully", "color: green; font-weight: bold;");
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
  } else {
    initializeCart();
  }
}
