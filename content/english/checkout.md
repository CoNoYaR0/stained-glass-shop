---
title: "Paiement"
url: /checkout/
---

<form id="paymee-form">
  <label for="email">Votre email :</label><br>
  <input type="email" name="email" required value="stainedglass.ad@gmail.com"><br><br>

  <label for="amount">Montant (TND) :</label><br>
  <input type="number" name="amount" required value="10"><br><br>

  <button type="submit">Payer avec Paymee</button>
</form>

<p id="error-paymee" style="color: red; margin-top: 1rem;"></p>

<script src="/js/paymee.js"></script>
