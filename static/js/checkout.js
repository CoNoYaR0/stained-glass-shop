document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Ne rien faire si on n'est pas sur la page de checkout
  const form = document.getElementById("checkout-form");
  if (!form) {
    console.warn("⚠️ #checkout-form introuvable – checkout.js ne s'exécute pas.");
    return;
  }

  // 2️⃣ Récupérations sécurisées
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");
  const btn = form.querySelector("button[type='submit']");
  const paiementWrapper = document.getElementById("paiement-options");
  const cbWrapper = document.getElementById("cb-wrapper");

  // 3️⃣ Styliser le bouton “Valider la commande”
  if (btn) {
    Object.assign(btn.style, {
      backgroundColor: "#f7931e",
      border: "none",
      color: "white",
      fontWeight: "bold",
      fontSize: "1.1rem",
      padding: "12px 24px",
      borderRadius: "2rem",
      cursor: "pointer",
      width: "100%",
    });
  }

  // 4️⃣ Injecter les options de paiement
  if (paiementWrapper) {
    paiementWrapper.innerHTML = `
      <div>
        <label><input type="radio" name="paiement" value="cb"> Paiement par carte</label><br>
        <label><input type="radio" name="paiement" value="livraison"> Paiement à la livraison</label>
      </div>
    `;
  }

  // 5️⃣ Écouteur postMessage pour Paymee
  window.addEventListener("message", (event) => {
    const allowed = ["https://sandbox.paymee.tn", "https://app.paymee.tn"];
    if (!allowed.includes(event.origin)) return;
    if (event.data?.event_id === "paymee.complete") {
      localStorage.removeItem("customCart");
      window.location.replace("/merci");
    }
  }, false);

  // 6️⃣ Changement de mode de paiement
  if (paiementWrapper && cbWrapper) {
    paiementWrapper.querySelectorAll("input[name='paiement']").forEach(radio => {
      radio.addEventListener("change", () => {
        if (radio.value === "cb") {
          cbWrapper.classList.remove("hidden");
          injectIframe();
        } else {
          cbWrapper.classList.add("hidden");
          cbWrapper.innerHTML = "";
        }
      });
    });
  }

  // 7️⃣ Injection de l’iframe Paymee
  async function injectIframe() {
    const selected = document.querySelector("input[name='paiement']:checked")?.value;
    if (selected !== "cb" || !cbWrapper) return;

    const client = {
      nom: document.getElementById("name")?.value || "",
      email: document.getElementById("email")?.value || "",
      adresse: document.getElementById("address")?.value || "",
      // Ajoutez les autres champs si besoin...
    };

    const totalAmount = cart
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...client, amount: totalAmount, cart })
      });
      const data = await res.json();
      const paymentUrl = data?.data?.payment_url;
      if (!paymentUrl) {
        console.error("❌ Pas de payment_url dans la réponse.");
        return;
      }

      const iframe = document.createElement("iframe");
      Object.assign(iframe, {
        src: paymentUrl,
        width: "100%",
        height: "600",
        frameBorder: "0",
        allow: "payment",
      });
      iframe.style.borderRadius = "12px";

      cbWrapper.innerHTML = "";
      cbWrapper.appendChild(iframe);
      console.log("✅ Iframe Paymee chargée");
    } catch (err) {
      console.error("💥 Erreur create-payment :", err);
    }
  }

  // 8️⃣ Soumission pour paiement à la livraison
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      return alert("Votre panier est vide.");
    }
    const mode = form.querySelector("input[name='paiement']:checked")?.value;
    if (!mode) {
      return alert("Veuillez choisir un mode de paiement.");
    }

    // Relecture des données
    const client = {
      nom: document.getElementById("name")?.value || "",
      email: document.getElementById("email")?.value || "",
      adresse: document.getElementById("address")?.value || "",
      // …
    };
    const totalAmount = cart
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    if (mode === "livraison") {
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
          localStorage.removeItem("customCart");
          window.location.href = "/merci-livraison";
        } else {
          console.error("❌ create-order response:", result);
          alert("Erreur lors de la commande.");
        }
      } catch (err) {
        console.error("💥 Erreur create-order :", err);
        alert("Erreur serveur.");
      }
    }
    // Mode "cb" est géré par l'iframe + postMessage
  });
});
