document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  // On lit le panier dès le début
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");
  const btn = document.querySelector("#checkout-form button[type='submit']");
  const cbWrapper = document.getElementById("cb-wrapper");

  // 🎨 Style du bouton “Valider la commande”
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

  // Ajoute les options de paiement (CB / Livraison)
  const paiementWrapper = document.getElementById("paiement-options");
  if (paiementWrapper) {
    paiementWrapper.innerHTML = 
      <div>
        <label><input type="radio" name="paiement" value="cb"> Paiement par carte</label><br>
        <label><input type="radio" name="paiement" value="livraison"> Paiement à la livraison</label>
      </div>
    ;
  }

  // ─────────────────────────────────────────────────────────────────
  // 1) ÉCOUTEUR GLOBAL POUR paymee.complete (postMessage) ↓
  //    Permet de recevoir l’événement envoyé par l’iframe Paymee
  //    quand le paiement est terminé (mode Without Redirection).
  window.addEventListener("message", (event) => {
    // –– Sécurisation de l’origine ––
    // Remplacez par l'origine exacte de Paymee selon votre env.
    //   * En sandbox : "https://sandbox.paymee.tn"
    //   * En production : "https://app.paymee.tn"
    const allowedOrigins = [
      "https://sandbox.paymee.tn",
      "https://app.paymee.tn"
    ];
    if (!allowedOrigins.includes(event.origin)) {
      return; // on ignore tout message qui ne vient pas de Paymee
    }

    // –– Vérifier qu’on est bien sur l’événement paymee.complete ––
    if (event.data && event.data.event_id === "paymee.complete") {
      // ─── ACTION : vider le panier avant redirection ───
      localStorage.removeItem("customCart");

      // Redirection vers la page de remerciement /merci
      window.location.replace("/merci");
    }
  }, false);
  // ─────────────────────────────────────────────────────────────────

  // 2) Gestion du changement de mode de paiement
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

  // 3) Fonction pour injecter l’iframe si paiement CB sélectionné
  async function injectIframe() {
    const paiementSelected = document.querySelector("input[name='paiement']:checked")?.value;
    if (paiementSelected !== "cb") return;

    // On récupère les données client
    const client = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      tel: document.getElementById("tel").value,
      email: document.getElementById("email").value,
      adresse: document.getElementById("adresse").value
    };

    // Calcul du montant total
    const totalAmount = cart
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      .toFixed(2);

    try {
      // On appelle la Netlify Function create-payment
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...client, amount: totalAmount, cart })
      });

      const data = await res.json();
      const paymentUrl = data?.data?.payment_url;
      if (!paymentUrl) {
        console.error("❌ URL de paiement introuvable dans la réponse Paymee.");
        return;
      }

      // Création et injection de l’iframe Paymee
      const iframe = document.createElement("iframe");
      iframe.src = paymentUrl;
      iframe.width = "100%";
      iframe.height = "600";
      iframe.frameBorder = "0";
      iframe.allow = "payment";
      iframe.style.borderRadius = "12px";

      cbWrapper.innerHTML = "";
      cbWrapper.appendChild(iframe);

      console.log("✅ Iframe Paymee chargée");
      // → Note : En mode Without Redirection, l’iframe enverra un postMessage !
      //   C’est l’écouteur “window.addEventListener('message',…)” qui s’en chargera.
    } catch (err) {
      console.error("💥 Erreur lors de la création du paiement :", err);
    }
  }

  // 4) Soumission du formulaire (uniquement pour paiement à la livraison)
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

    // Relecture des données client
    const client = {
      nom: document.getElementById("nom").value,
      prenom: document.getElementById("prenom").value,
      tel: document.getElementById("tel").value,
      email: document.getElementById("email").value,
      adresse: document.getElementById("adresse").value
    };

    // Calcul du montant total
    const totalAmount = cart
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      .toFixed(2);

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
          // ─── ACTION : vider le panier avant redirection ───
          localStorage.removeItem("customCart");

          // Redirection vers la page de remerciement /merci-livraison
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
    // Si paiement CB, on ne fait rien ici : c’est l’iframe + postMessage qui gèrent.
  });
}); 
