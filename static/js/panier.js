document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Votre panier est vide.</p>";
    totalEl.textContent = "0.000 DT";
    return;
  }

  let total = 0;
  cartItems.innerHTML = "";

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    const row = document.createElement("div");
    row.classList.add("cart-item");
    row.style = "display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;";

    row.innerHTML = `
      <div style="display:flex; align-items:center;">
        <img src="${item.image}" alt="${item.name}" style="width:60px; height:60px; object-fit:cover; margin-right:1rem;">
        <div>
          <strong>${item.name}</strong><br>
          ${item.qty} x ${item.price.toFixed(3)} DT
        </div>
      </div>
      <button onclick="removeFromCart(${index})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px;">Supprimer</button>
    `;

    cartItems.appendChild(row);
  });

  totalEl.textContent = `${total.toFixed(3)} DT`;
});

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  location.reload(); // Recharge la page pour mettre à jour le panier
}
