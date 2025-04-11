// Met à jour le badge panier dans le header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = count;
  }
  
  // Ajouter un produit au panier
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
    alert("Produit ajouté au panier !");
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
