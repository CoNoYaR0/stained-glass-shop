
+++
title = "Merci pour votre commande"
url = "/merci/"
+++

<h1>Merci ! 🎉</h1>
<p>Votre commande a bien été reçue. Nous la traitons avec soin.</p>
<p>Un email de confirmation vous sera envoyé sous peu afin de :</p>
<ul>
  <li>Confirmer les détails de votre commande</li>
  <li>Fixer une date de livraison</li>
  <li>Valider votre bon de livraison</li>
</ul>

<p>Nous restons à votre disposition pour toute question complémentaire.</p>

 <!-- 🔁 Auto-redirect fallback au cas où Paymee bloque -->
<script>
  setTimeout(() => {
    if (!document.referrer.includes("paymee")) return;
    window.location.href = "/merci";
  }, 3000);
</script>
