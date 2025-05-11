document.addEventListener("DOMContentLoaded", async () => {
  const checkoutForm = document.getElementById("checkout-form");
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");

  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const client = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      tel: document.getElementById("tel").value,
      email: document.getElementById("email").value,
      adresse: document.getElementById("adresse").value
    };

    if (cart.length === 0) {
      alert("Panier vide.");
      return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...client, amount: totalAmount, cart })
      });

      const data = await res.json();

      if (data?.data?.payment_url) {
        window.location.href = data.data.payment_url;
      } else {
        alert("Erreur de génération lien de paiement.");
        console.error(data);
      }
    } catch (err) {
      alert("Erreur d'envoi vers Paymee.");
      console.error("Erreur Paymee:", err);
    }
  });
});