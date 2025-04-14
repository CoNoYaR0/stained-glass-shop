document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Checkout DOM prêt – redirection contrôlée");

  const form = document.getElementById("checkout-form");
  const CART_KEY = "customCart";
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  if (!form || cart.length === 0) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const requestData = {
      prenom: data.prenom,
      nom: data.nom,
      tel: data.tel,
      email: data.email,
      adresse: data.adresse,
      amount: total
    };

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        body: JSON.stringify(requestData)
      });
      const result = await res.json();
      console.log("✅ Réponse de Paymee :", result);

      if (result.data && result.data.payment_url) {
        window.location.href = result.data.payment_url;
      } else {
        alert("Erreur : lien de paiement introuvable.");
        console.warn("❌ Données reçues :", result);
      }
    } catch (err) {
      console.error("❌ Erreur redirection Paymee :", err);
      alert("Erreur de communication avec Paymee.");
    }
  });
});