document.addEventListener("DOMContentLoaded", () => {
  console.log("✔️ DOM prêt – initialisation paiement Paymee");

  const CART_KEY = "customCart";
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  console.log("🧮 Total du panier :", total);

  const requestData = {
    prenom: "Client",
    nom: "Stained",
    email: "test@paymee.tn",
    tel: "52080220",
    amount: total
  };

  fetch("/.netlify/functions/create-payment", {
    method: "POST",
    body: JSON.stringify(requestData)
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("💬 Réponse de create-payment :", data);
      if (data.data && data.data.payment_url) {
        console.log("🔁 Redirection vers Paymee :", data.data.payment_url);
        window.location.href = data.data.payment_url;
      } else {
        console.warn("⚠️ Aucun payment_url reçu");
        alert("Erreur : Paymee désactivé temporairement.");
      }
    })
    .catch((err) => {
      console.error("❌ Erreur fetch create-payment:", err);
      alert("Erreur de connexion avec Paymee.");
    });
});
