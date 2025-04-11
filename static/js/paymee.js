document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('paymee-form');
    const container = document.getElementById('paymee-container');
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const email = document.getElementById('email').value;
      const amount = parseFloat(document.getElementById('amount').value);
  
      container.innerHTML = "⏳ Chargement du paiement...";
  
      const response = await fetch("https://7ssab.stainedglass.tn/custom/paymee/generate.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount })
      });
  
      const result = await response.json();
  
      if (result.success && result.payment_url) {
        container.innerHTML = `
          <iframe src="${result.payment_url}" width="100%" height="600" frameborder="0" allow="payment"></iframe>
        `;
      } else {
        container.innerHTML = `<p style="color:red;">Erreur Paymee : ${result.message || 'Impossible de charger le paiement.'}</p>`;
      }
    });
  });
  