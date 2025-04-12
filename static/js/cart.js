document.addEventListener("DOMContentLoaded", function () {
    const CART_KEY = "customCart";
  
    // 🧱 Init panier s'il n'existe pas
    if (!localStorage.getItem(CART_KEY)) {
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
  
    // 📥 Ajouter un produit
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
  
    // 🔢 Mettre à jour le compteur panier
    function updateCartCount() {
      const cart = JSON.parse(localStorage.getItem(CART_KEY));
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      const countElem = document.getElementById("cart-count");
      if (countElem) countElem.textContent = total;
    }
  
    // 🧲 Capter clics sur tous les boutons "add-to-cart"
    document.querySelectorAll(".add-to-cart").forEach(button => {
      button.addEventListener("click", () => {
        const product = {
          id: button.dataset.id,
          name: button.dataset.name,
          price: parseFloat(button.dataset.price),
          image: button.dataset.image || "",
          url: button.dataset.url || "",
          colorOptions: button.dataset.colorOptions?.split("|") || [],
          sizeOptions: button.dataset.sizeOptions?.split("|") || [],
        };
  
        addToCart(product);
      });
    });
  
    // 🔁 Met à jour compteur au démarrage
    updateCartCount();
  });
  
  // Ouvrir/Fermer le panneau
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

// 🧾 Afficher les articles dans le panneau
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
      <strong>${item.name}</strong><br>
      <small>${item.quantity} × ${item.price.toFixed(2)} TND</small>
      <hr>
    `;
    container.appendChild(itemEl);
    total += item.quantity * item.price;
  });

  totalEl.textContent = total.toFixed(2);
}

document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // ⛔ empêche la redirection

    const product = {
      id: button.dataset.id,
      name: button.dataset.name,
      price: parseFloat(button.dataset.price),
      image: button.dataset.image || "",
      url: button.dataset.url || "",
      colorOptions: button.dataset.colorOptions?.split("|") || [],
      sizeOptions: button.dataset.sizeOptions?.split("|") || [],
    };

    addToCart(product);
  });
});
