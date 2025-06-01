document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("checkout-form");
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");
  const btn = document.querySelector("#checkout-form button[type='submit']");
  const cbWrapper = document.getElementById("cb-wrapper");

  // 🎨 Bouton stylisé
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

  // Ajoute les options de paiement si manquantes
  const paiementWrapper = document.getElementById("paiement-options");
  if (paiementWrapper && paiementWrapper.children.length === 0) {
    paiementWrapper.innerHTML = `
      <div>
        <label><input type="radio" name="paiement" value="cb" checked> Paiement par carte</label><br>
        <label><input type="radio" name="paiement" value="livraison"> Paiement à la livraison</label>
      </div>
    `;
  }

  // Écoute les changements d’option de paiement
  document.querySelectorAll('input[name="paiement"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value === "cb") {
        cbWrapper.classList.remove("hidden");
        injectIframe();
      } else {
        cbWrapper.classList.add("hidden");
        cbWrapper.innerHTML = "";
      }
    });
  });

  // Fonction pour injecter l'iframe si paiement CB sélectionné
  async function injectIframe() {
    const paiementSelected = document.querySelector("input[name='paiement']:checked")?.value;
    if (paiementSelected !== "cb") return;

    const client = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      tel: document.getElementById("tel").value,
      email: document.getElementById("email").value,
      adresse: document.getElementById("adresse").value
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...client, amount: totalAmount, cart })
      });

      const data = await res.json();
      const token = new URL(data?.data?.payment_url || "").searchParams.get("payment_token");
      if (!token) {
        console.error("❌ Token introuvable dans la réponse Paymee.");
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.src = `https://app.paymee.tn/gateway/loader?payment_token=${token}`;
      iframe.width = "100%";
      iframe.height = "600";
      iframe.frameBorder = "0";
      iframe.allow = "payment";
      iframe.style.borderRadius = "12px";

      cbWrapper.innerHTML = "";
      cbWrapper.appendChild(iframe);

      console.log("✅ Iframe Paymee chargée avec succès");
    } catch (err) {
      console.error("💥 Erreur lors de la création du paiement :", err);
    }
  }

  // Form submission
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

    if (paiement === "livraison") {
      try {
        const res = await fetch("/.netlify/functions/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  // Injecter l'iframe dès le chargement si CB par défaut
  const defaultPaiement = document.querySelector('input[name="paiement"]:checked')?.value;
  if (defaultPaiement === "cb") {
    cbWrapper.classList.remove("hidden");
    injectIframe();
  }
});
