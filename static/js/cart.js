if (typeof window.CART_JS_INITIALIZED === 'undefined') {
  window.CART_JS_INITIALIZED = true;

  // Original content of static/js/cart.js starts here
  const CART_KEY = "customCart";

  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
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
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElem = document.getElementById("cart-count");
    if (countElem) countElem.textContent = total;
  }

  function attachAddToCartButtons() {
    const buttons = document.querySelectorAll(".add-to-cart");

    if (buttons.length === 0) {
      setTimeout(attachAddToCartButtons, 300); // Retry if buttons not found yet
      return;
    }

    buttons.forEach((button) => {
      // Prevent adding multiple listeners if script runs again (though CART_JS_INITIALIZED should prevent this)
      if (button.dataset.listenerAttached === 'true') return;
      button.dataset.listenerAttached = 'true';

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // Empêche la propagation au lien parent <a>

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

  document.addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem(CART_KEY)) {
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    }

    function renderCartItems() {
      const cart = JSON.parse(localStorage.getItem(CART_KEY));
      const container = document.getElementById("cart-items");
      const totalEl = document.getElementById("cart-total");

      if (!container || !totalEl) { // Ensure elements exist
        console.warn("Cart container or total element not found. Skipping cart rendering.");
        return;
      }

      if (!cart || !cart.length) { // Ensure cart is an array
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
      if (!container) return; // Ensure container exists

      container.querySelectorAll(".increase-qty").forEach(button => {
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
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
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
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
        if (button.dataset.listenerAttached === 'true') return;
        button.dataset.listenerAttached = 'true';
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

    updateCartCount(); // Initial call

    const openCartBtn = document.getElementById("open-cart");
    const closeCartBtn = document.getElementById("close-cart");
    const cartPanel = document.getElementById("custom-cart-panel");

    if (openCartBtn && closeCartBtn && cartPanel) {
      openCartBtn.addEventListener("click", () => {
        cartPanel.classList.remove("hidden");
        cartPanel.classList.add("visible");
        renderCartItems(); // Re-render cart items when opening
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

    const checkoutButton = document.getElementById("checkout-button"); // This might be a duplicate selector for checkoutBtn
    if (checkoutButton) {
      checkoutButton.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("➡️ Redirection vers /checkout/");
        window.location.href = "/checkout/";
      });
    } else {
      // console.warn("🛑 #checkout-button non trouvé"); // It's fine if only one checkout button exists
    }

    // Call attachAddToCartButtons to ensure listeners are attached, especially for dynamically added content.
    // The retry mechanism inside attachAddToCartButtons handles cases where elements might not be immediately available.
    attachAddToCartButtons();
  });
  // Original content of static/js/cart.js ends here

} // End of window.CART_JS_INITIALIZED check