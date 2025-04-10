---
title: "Payment"
url: /checkout/
---

<form method="POST" action="https://7ssab.stainedglass.tn/custom/flouci/payment.php">
  <label for="email">Your email:</label><br>
  <input type="email" name="email" required placeholder="email@example.com"><br><br>

  <label for="amount">Amount (in millimes):</label><br>
  <input type="number" name="amount" required value="12000"><br><br>

  <button type="submit">Pay with Flouci</button>
</form>
