---
title: "Paiement"
url: /fr/checkout/
---

<form method="POST" action="https://7ssab.stainedglass.tn/custom/flouci/payment.php">
  <label for="email">Votre email :</label><br>
  <input type="email" name="email" required placeholder="email@exemple.com"><br><br>

  <label for="amount">Montant (en millimes) :</label><br>
  <input type="number" name="amount" required value="12000"><br><br>

  <button type="submit">Payer avec Flouci</button>
</form>
