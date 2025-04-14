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
  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");
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
        console.log("💬 Réponse LIVE :", data);
        if (data.data && data.data.token) {
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.paymee.tn/gateway/${data.data.token}`;
          iframe.style.width = "100%";
          iframe.style.height = "505px";
          iframe.style.border = "none";
          iframe.id = "paymee-iframe";
          paymentContainer.innerHTML = "";
          paymentContainer.appendChild(iframe);
        } else {
          alert("❌ Paiement indisponible.");
          paymentContainer.innerHTML = "<p class='text-danger'>Erreur : token non reçu.</p>";
        }
      })
      .catch(err => {
        console.error("❌ Erreur fetch:", err);
        paymentContainer.innerHTML = "<p class='text-danger'>Erreur réseau avec Paymee.</p>";
      });
  });
});
