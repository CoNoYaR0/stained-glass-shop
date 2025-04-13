
document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "customCart";
  const checkoutApp = document.getElementById("checkout-app");

  if (!checkoutApp) return;

  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  if (cart.length === 0) {
    checkoutApp.innerHTML = "<p class='text-muted'>Votre panier est vide.</p>";
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let itemsHTML = `
    <h2>Résumé de votre commande</h2>
    <table class="table table-bordered mb-4">
      <thead><tr><th>Produit</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
      <tbody>
  `;

  cart.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    itemsHTML += `
      <tr>
        <td>
          <img src="${item.image}" alt="${item.name}" style="width: 40px; height: auto; margin-right: 10px;">
          ${item.name}
        </td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} TND</td>
        <td>${itemTotal} TND</td>
      </tr>
    `;
  });

  itemsHTML += `
      </tbody>
    </table>
    <p><strong>Total : ${total.toFixed(2)} TND</strong></p>
  `;

  const formHTML = `
    <h3>Informations client</h3>
    <form id="checkout-form" class="mb-4">
      <div class="form-group">
        <input class="form-control mb-2" name="nom" placeholder="Nom" required>
        <input class="form-control mb-2" name="prenom" placeholder="Prénom" required>
        <input class="form-control mb-2" name="tel" placeholder="Téléphone" required>
        <input class="form-control mb-2" name="email" placeholder="Email" type="email" required>
        <textarea class="form-control mb-3" name="adresse" placeholder="Adresse complète" required></textarea>
      </div>
      <h4 class="mb-2">Méthode de paiement</h4>
      <div class="form-check mb-2">
        <input class="form-check-input" type="radio" name="paiement" value="paymee" id="paymee" checked>
        <label class="form-check-label" for="paymee">Paymee (par défaut)</label>
      </div>
      <div class="form-check mb-2">
        <input class="form-check-input" type="radio" name="paiement" value="flouci" id="flouci">
        <label class="form-check-label" for="flouci">Flouci</label>
      </div>
      <div class="form-check mb-4">
        <input class="form-check-input" type="radio" name="paiement" value="livraison" id="livraison">
        <label class="form-check-label" for="livraison">Paiement à la livraison</label>
      </div>
      <button class="btn btn-main w-100" type="submit">Valider la commande</button>
    </form>
  `;

  checkoutApp.innerHTML = itemsHTML + formHTML;

  document.getElementById("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Commande envoyée ! (Simulation)");
    localStorage.removeItem(CART_KEY);
    location.href = "/";
  });
});
