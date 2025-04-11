document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("paymee-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value;
    const amount = form.amount.value;
    const errorEl = document.getElementById("error-paymee");

    errorEl.innerText = "⏳ Chargement du paiement...";

    try {
      const res = await fetch("https://7ssab.stainedglass.tn/custom/paymee/generate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, amount })
      });

      const data = await res.json();
      console.log(data); // 🔍 pour debug

      if (!data.success || !data.payment_url) {
        throw new Error("Erreur Paymee : " + (data.message || "Réponse invalide"));
      }

      // ✅ Redirection vers la page de paiement Paymee
      window.location.href = data.payment_url;

    } catch (err) {
      console.error(err);
      errorEl.innerText = err.message;
    }
  });
});
