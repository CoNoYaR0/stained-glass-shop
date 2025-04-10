---
title: "Paiement"
url: /fr/checkout/
---

<form method="POST" action="https://7ssab.stainedglass.tn/custom/flouci/payment.php" onsubmit="convertToMillimes()">
  <label for="email">Votre email :</label><br>
  <input type="email" name="email" required placeholder="email@exemple.com"><br><br>

  <label for="amount_dinars">Montant (en dinars TND) :</label><br>
  <input type="number" id="amount_dinars" step="0.001" required value="12"><br><br>

  <!-- Ce champ sera rempli automatiquement en millimes -->
  <input type="hidden" name="amount" id="amount_millimes">

  <button type="submit">Payer avec Flouci</button>
</form>

<script>
  function convertToMillimes() {
    const amountDinars = parseFloat(document.getElementById("amount_dinars").value);
    const amountMillimes = Math.round(amountDinars * 1000);
    document.getElementById("amount_millimes").value = amountMillimes;
  }
</script>
