// ✅ Gestion du badge panier
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = count;
}

// ✅ Suppression d'un article (générique)
function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCartPanel?.(); // si fonction dispo
  renderPanierPage?.(); // idem
}

// ✅ Affichage panel panier
function openCartPanel() {
  document.getElementById("cart-panel").classList.add("open");
  document.getElementById("cart-overlay").classList.add("open");
  renderCartPanel();
}
function closeCartPanel() {
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("cart-overlay").classList.remove("open");
}

// ✅ Render contenu dans le panel
function renderCartPanel() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const container = document.getElementById("cart-panel-items");
  const totalEl = document.getElementById("cart-panel-total");
  container.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const line = document.createElement("div");
    line.className = "cart-item";
    line.innerHTML = `
      <div style="display:flex;align-items:center;">
        <img src="${item.image}" style="width:50px;height:50px;margin-right:10px;">
        <div>
          <strong>${item.name}</strong><br>
          ${item.qty} x ${parseFloat(item.price).toFixed(3)} DT
        </div>
      </div>
      <button onclick="removeFromCart(${index})">Supprimer</button>
    `;
    container.appendChild(line);
    total += parseFloat(item.price) * item.qty;
  });

  totalEl.textContent = total.toFixed(3) + " DT";
}

// ✅ Render contenu sur /panier/ uniquement
function renderPanierPage() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const itemsContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!itemsContainer || !totalEl) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = "<p>Votre panier est vide.</p>";
    totalEl.textContent = "0.000 DT";
    return;
  }

  let total = 0;
  itemsContainer.innerHTML = "";

  cart.forEach((item, index) => {
    total += parseFloat(item.price) * item.qty;

    const row = document.createElement("div");
    row.classList.add("cart-item");
    row.innerHTML = `
      <div style="display:flex;align-items:center;">
        <img src="${item.image}" style="width:60px;height:60px;object-fit:cover;margin-right:10px;">
        <div>
          <strong>${item.name}</strong><br>
          ${item.qty} x ${parseFloat(item.price).toFixed(3)} DT
        </div>
      </div>
      <button onclick="removeFromCart(${index})">Supprimer</button>
    `;
    itemsContainer.appendChild(row);
  });

  totalEl.textContent = total.toFixed(3) + " DT";
}

// ✅ Ajouter un produit au panier
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += product.qty;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCartPanel?.();
  renderPanierPage?.();

  // Feedback visuel (optionnel)
  if (typeof toast !== 'undefined') {
    toast("Produit ajouté !");
  } else {
    console.log("Produit ajouté :", product.name);
  }
}

// ✅ Init globale
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  const page = document.body.dataset.page;
  if (page === "panier") {
    renderPanierPage();
  }

  const openBtn = document.querySelector(".cart-custom");
  const closeBtn = document.getElementById("close-cart");
  const overlay = document.getElementById("cart-overlay");

  if (openBtn) openBtn.addEventListener("click", openCartPanel);
  if (closeBtn) closeBtn.addEventListener("click", closeCartPanel);
  if (overlay) overlay.addEventListener("click", closeCartPanel);
});
