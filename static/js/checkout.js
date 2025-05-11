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

    const paiement = checkoutForm.querySelector('input[name="paiement"]:checked')?.value;

    if (!paiement || cart.length === 0) {
      alert("Méthode de paiement ou panier invalide.");
      return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    if (paiement === "cb") {
      // Paiement via Paymee
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
          alert("Erreur de génération du lien de paiement.");
          console.error(data);
        }
      } catch (err) {
        alert("Erreur lors de l'envoi vers Paymee.");
        console.error(err);
      }
    } else {
      // Paiement à la livraison
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
            totalTTC: totalAmount,
            paiement: "livraison"
          })
        });

        const result = await res.json();

        if (result.success) {
          window.location.href = "/merci-livraison";
        } else {
          alert("Erreur lors de la création de la commande.");
          console.error(result);
        }
      } catch (err) {
        alert("Erreur d'envoi de la commande.");
        console.error(err);
      }
    }
  });
});