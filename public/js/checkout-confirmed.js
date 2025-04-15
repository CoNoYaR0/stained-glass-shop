
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
    <h2 class="mb-4">Résumé de votre commande</h2>
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
    <p class="mb-5"><strong>Total : ${total.toFixed(2)} TND</strong></p>
  `;

  const formHTML = `
    <h3 class="mb-3">Informations client</h3>
    <form id="checkout-form">
      <div class="form-group mb-3">
        <input class="form-control mb-2" name="nom" placeholder="Nom" required>
        <input class="form-control mb-2" name="prenom" placeholder="Prénom" required>
        <input class="form-control mb-2" name="tel" placeholder="Téléphone" required>
        <input class="form-control mb-2" name="email" placeholder="Email" type="email" required>
        <textarea class="form-control mb-3" name="adresse" placeholder="Adresse complète" required></textarea>
      </div>

      <h4 class="mb-3">Méthode de paiement</h4>
      <div class="d-flex justify-content-center gap-4 flex-wrap">
        <label class="payment-option">
          <input type="radio" name="paiement" value="cb" id="cb" checked>
          <div class="option-box">
            <img src="/images/payments/paymee-logo.png" alt="Carte bancaire">
            <span>CB</span>
          </div>
        </label>

        <label class="payment-option">
          <input type="radio" name="paiement" value="livraison" id="livraison">
          <div class="option-box">
            <img src="/images/payments/delivery.png" alt="Paiement à la livraison">
            <span>À la livraison</span>
          </div>
        </label>
      </div>

      <button class="btn btn-main w-100 mt-4" type="submit">Valider la commande</button>
    </form>

    <div id="geo-message" class="alert alert-info mt-4 d-none text-center">
      💡 Le montant sera affiché en <strong>TND</strong> (Dinar Tunisien) sur la page de paiement.<br>
      La conversion est automatique via votre carte bancaire. Pas d'inquiétude 💛
    </div>
  `;

  checkoutApp.innerHTML = itemsHTML + formHTML;

  document.getElementById("checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const paiement = formData.get("paiement");

    const client = {
      nom: formData.get("nom"),
      prenom: formData.get("prenom"),
      tel: formData.get("tel"),
      email: formData.get("email"),
      adresse: formData.get("adresse"),
      amount: total.toFixed(2)
    };

    if (paiement === "livraison") {
      try {
        const res = await fetch("/.netlify/functions/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-secret-key": "CoNoYaRosKy@55#"
          },
          body: JSON.stringify({
            customer: client,
            cart: cart.map(p => ({
              id: p.id,
              qty: p.quantity,
              price_ht: p.price,
              tva: 20
            })),
            totalTTC: client.amount
          })
        });

        const result = await res.json();
        if (result.success) {
          localStorage.removeItem(CART_KEY);
          window.location.href = "/merci-livraison";
        } else {
          alert("Erreur : " + (result.error || "Échec création commande."));
        }
      } catch (err) {
        console.error("Erreur livraison :", err);
        alert("Erreur de traitement de la commande.");
      }
    } else {
      try {
        const res = await fetch("/.netlify/functions/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(client)
        });

        const data = await res.json();

        if (data?.data?.payment_url) {
          const geoMsg = document.getElementById("geo-message");
          fetch("https://ipapi.co/json")
            .then(r => r.json())
            .then(info => {
              if (info.country !== "TN") {
                geoMsg.classList.remove("d-none");
                const confirmBtn = document.createElement("button");
                confirmBtn.className = "btn btn-main mt-3";
                confirmBtn.textContent = "Je comprends, continuer vers le paiement";
                confirmBtn.onclick = () => {
                  geoMsg.classList.add("d-none");
                  localStorage.removeItem(CART_KEY);
                  window.location.href = data.data.payment_url;
                };
                geoMsg.appendChild(confirmBtn);
              } else {
                localStorage.removeItem(CART_KEY);
                window.location.href = data.data.payment_url;
              }
            }).catch(() => {
              localStorage.removeItem(CART_KEY);
              window.location.href = data.data.payment_url;
            });
        } else {
          alert("Erreur : aucun lien de paiement reçu.");
          console.error(data);
        }
      } catch (err) {
        alert("Erreur lors de l'envoi du paiement.");
        console.error("Erreur Paymee:", err);
      }
    }
  });
});
