
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://sandbox.paymee.tn/api/v2/payments/create";
  const API_TOKEN = "43acae674b258afc9219af50d778c12781455a0f";
  const CART_KEY = "customCart";

  const paymentContainer = document.createElement("div");
  paymentContainer.id = "paymee-container";
  paymentContainer.style.marginTop = "20px";
  document.getElementById("checkout-app").appendChild(paymentContainer);

  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const createPaymeeIframe = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token " + API_TOKEN
        },
        body: JSON.stringify({
          vendor: 3724,
          amount: total,
          note: "Commande depuis checkout",
          first_name: "Client",
          last_name: "Sandbox",
          email: "client@exemple.com",
          phone: "22123456",
          return_url: window.location.origin + "/merci",
          cancel_url: window.location.href,
          webhook_url: window.location.origin + "/webhook"
        })
      });

      const data = await response.json();
      if (data.payment_url) {
        const iframe = document.createElement("iframe");
        iframe.src = data.payment_url;
        iframe.style.width = "100%";
        iframe.style.height = "650px";
        iframe.style.border = "none";
        iframe.id = "paymee-iframe";
        paymentContainer.innerHTML = "";
        paymentContainer.appendChild(iframe);
      } else {
        paymentContainer.innerHTML = "<p class='text-danger'>Erreur lors de l'obtention du paiement Paymee.</p>";
      }
    } catch (error) {
      console.error("Erreur Paymee:", error);
      paymentContainer.innerHTML = "<p class='text-danger'>Erreur de connexion avec Paymee.</p>";
    }
  };

  // Affiche Paymee par défaut
  createPaymeeIframe();

  // Toggle l'affichage de l'iframe selon la méthode choisie
  const radios = document.querySelectorAll("input[name='paiement']");
  radios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "paymee") {
        paymentContainer.style.display = "block";
        createPaymeeIframe();
      } else {
        paymentContainer.style.display = "none";
      }
    });
  });
});
