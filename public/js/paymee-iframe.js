
document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "customCart";
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const paymentContainer = document.createElement("div");
  paymentContainer.id = "paymee-container";
  paymentContainer.style.marginTop = "20px";
  document.getElementById("checkout-app").appendChild(paymentContainer);

  const requestData = {
    prenom: "Client",
    nom: "Sandbox",
    email: "test@paymee.tn",
    tel: "20202020",
    amount: total
  };

  fetch("/.netlify/functions/create-payment", {
    method: "POST",
    body: JSON.stringify(requestData)
  })
    .then(res => res.json())
    .then(data => {
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
        alert("⚠️ Paiement indisponible : votre compte Paymee doit être validé.");
        paymentContainer.innerHTML = "<p class='text-danger'>Paymee désactivé temporairement.</p>";
      }
    })
    .catch(err => {
      console.error("Erreur Paymee:", err);
      alert("❌ Erreur technique avec Paymee.");
      paymentContainer.innerHTML = "<p class='text-danger'>Erreur de connexion avec Paymee.</p>";
    });

  document.querySelectorAll("input[name='paiement']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      paymentContainer.style.display = e.target.value === "paymee" ? "block" : "none";
    });
  });
});
