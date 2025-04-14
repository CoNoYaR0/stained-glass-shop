// Helper stable : attend qu'un élément apparaisse dans le DOM
function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) return callback(el);

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "customCart";
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const requestData = {
    prenom: "Client",
    nom: "Stained",
    email: "test@paymee.tn",
    tel: "52080220",
    amount: total
  };

  waitForElement("#checkout-app", (container) => {
    const paymentContainer = document.createElement("div");
    paymentContainer.id = "paymee-container";
    paymentContainer.style.marginTop = "20px";
    container.appendChild(paymentContainer);

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
          iframe.style.height = "505px";
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
  });
});
