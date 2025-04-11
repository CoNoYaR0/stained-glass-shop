---
title: "Paiement"
url: /fr/checkout/
---

<form id="paymee-form">
  <label for="email">Votre email :</label><br>
  <input type="email" name="email" id="email" required><br><br>

  <label for="amount">Montant (TND) :</label><br>
  <input type="number" name="amount" id="amount" step="0.001" required><br><br>

  <button type="submit">Payer avec Paymee</button>
</form>

<div id="paymee-container" style="margin-top: 30px;"></div>

<script src="/js/paymee.js"></script>
