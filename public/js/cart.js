// Met à jour le badge panier dans le header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
  }
  
  // Pour supprimer un article par son index (utile dans /panier/)
  function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  }
  
  // Init du badge dès que la page est chargée
  document.addEventListener("DOMContentLoaded", updateCartCount);
  
// Animation + Ajout au panier
function handleAddToCart(button, item) {
  const originalText = button.innerHTML;

  // État visuel "chargement"
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span> Ajout...`;

  // Simule une requête (tu peux ajuster le délai ou utiliser fetch ici)
  setTimeout(() => {
    addToCart(item); // ajoute l’article au panier

    // Confirmation temporaire
    button.innerHTML = `✅ Ajouté !`;

    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = originalText;
    }, 1500);
  }, 600);
}


// Activer l'affichage du bouton au tap mobile
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll('.product-item');

  items.forEach(item => {
    item.addEventListener("touchstart", function (e) {
      items.forEach(el => {
        if (el !== item) el.classList.remove("show-btn");
      });
      item.classList.toggle("show-btn");
      e.stopPropagation();
    });
  });

  document.body.addEventListener("touchstart", function () {
    items.forEach(el => el.classList.remove("show-btn"));
  }, { passive: true });
});


// ✅ Toast visuel + badge animée
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style = "position:fixed;top:20px;right:20px;background:#f9a743;color:#fff;padding:10px 20px;border-radius:5px;z-index:9999;font-weight:bold;box-shadow:0 0 10px rgba(0,0,0,0.2);transition:opacity 0.3s ease;";
  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = "0", 2000);
  setTimeout(() => toast.remove(), 2500);
}

// 🎯 Ajout au panier avec animation
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

  // Animation badge
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.classList.remove("animate");
    void badge.offsetWidth; // reset animation
    badge.classList.add("animate");
  }

  showToast("✅ Produit ajouté au panier");
}

// Scroll lock si panel visible
const panel = document.getElementById("cartPanelElement");
const overlay = document.getElementById("cart-overlay");

if (panel && overlay) {
  overlay.addEventListener("click", () => {
    document.body.style.overflow = '';
  });

  document.getElementById("close-cart").addEventListener("click", () => {
    document.body.style.overflow = '';
  });
}
