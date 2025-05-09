
document.addEventListener("DOMContentLoaded", async () => {
  const checkoutForm = document.getElementById("checkout-form");
  const paymeeContainer = document.getElementById("paymee-iframe-container");
  const paymeeIframe = document.getElementById("paymee-iframe");
  const iframeLoader = document.getElementById("iframe-loader");

  const cart = JSON.parse(localStorage.getItem("customCart") || "[]");

  if (!checkoutForm || !paymeeContainer || !paymeeIframe) return;

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

      
let data;
try {
  data = await res.json();
} catch (jsonError) {
  console.error("❌ Erreur lors du parsing JSON de la réponse Paymee:", jsonError);
  alert("Erreur de communication avec le serveur de paiement.");
  return;
}


      if (data?.data?.payment_url && data?.data?.note) {
        paymeeIframe.src = data.data.payment_url;
        paymeeContainer.style.display = "block";
        if (iframeLoader) iframeLoader.style.display = "none";

        const note = data.data.note;
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await fetch("/.netlify/functions/check-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ note })
            });
            const status = await statusRes.json();

            if (status?.status === "paid") {
              clearInterval(intervalId);

              await fetch("/.netlify/functions/create-order", {
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
                  paiement: "cb"
                })
              });

              window.location.href = "/merci-cb";
            }
          } catch (err) {
            console.error("Erreur vérification paiement:", err);
          }
        }, 5000);
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
