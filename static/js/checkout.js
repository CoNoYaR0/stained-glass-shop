document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");
  const btn = document.querySelector("#checkout-form button[type='submit']");

  // 🎨 Style le bouton pour matcher le thème (orange + flat)
  if (btn) {
    btn.style.backgroundColor = "#f7931e";
    btn.style.border = "none";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "1.1rem";
    btn.style.padding = "12px 24px";
    btn.style.borderRadius = "2rem";
    btn.style.cursor = "pointer";
    btn.style.width = "100%";
  }

  // Ajoute dynamiquement les options de paiement si elles n'existent pas
  const paiementWrapper = document.getElementById("paiement-options");
  if (paiementWrapper && paiementWrapper.children.length === 0) {
    paiementWrapper.innerHTML = `
      <div>
        <label><input type="radio" name="paiement" value="cb" checked> Paiement par carte</label><br>
        <label><input type="radio" name="paiement" value="livraison"> Paiement à la livraison</label>
      </div>
    `;
  }

  // Gère le mode de paiement visible
  const paiementRadios = document.querySelectorAll('input[name="paiement"]');
  paiementRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      const selected = document.querySelector('input[name="paiement"]:checked')?.value;
      const iframeWrapper = document.getElementById("cb-wrapper");
      if (selected === "cb") {
        iframeWrapper?.classList.remove("hidden");
      } else {
        iframeWrapper?.classList.add("hidden");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    const paiement = form.querySelector('input[name="paiement"]:checked')?.value;
    if (!paiement) {
      alert("Veuillez choisir un mode de paiement.");
      return;
    }

    const client = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      tel: document.getElementById("tel").value,
      email: document.getElementById("email").value,
      adresse: document.getElementById("adresse").value
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    if (paiement === "cb") {
      try {
        const res = await fetch("/.netlify/functions/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...client, amount: totalAmount, cart })
        });

        const data = await res.json();

        if (!data?.data?.payment_url) {
          alert("Erreur : aucune URL de paiement reçue.");
          return;
        }

        const token = new URL(data.data.payment_url).searchParams.get("payment_token");
        if (!token) {
          alert("Erreur : token introuvable.");
          return;
        }

        window.location.href = `/paiement?token=${token}`;
      } catch (err) {
        alert("Erreur de connexion avec Paymee.");
        console.error(err);
      }
    } else {
      try {
        const res = await fetch("/.netlify/functions/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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
          alert("Erreur lors de la commande.");
          console.error(result);
        }
      } catch (err) {
        alert("Erreur serveur.");
        console.error(err);
      }
    }
  });
});
