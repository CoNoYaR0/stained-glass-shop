---
title: "Merci pour votre paiement"
url: "/merci/"
layout: "default"
---

<aside class="text-center my-4">
  <!-- Suggestion d'image : un visuel de remerciement festif, en accord avec votre charte graphique -->
  <img src="/images/thank-you.svg" alt="Merci pour votre paiement" class="img-fluid" style="max-width: 250px;">
</aside>

# Merci pour votre paiement ! 🎉

Votre règlement a bien été pris en compte. Nous préparons votre commande dans les meilleurs délais.

Un e-mail de confirmation comprenant :  
- Les détails exacts de votre commande  
- Votre facture au format PDF  
- Les informations relatives à la livraison  

vous sera envoyé d’ici quelques instants. Si vous ne recevez rien sous 10 minutes, vérifiez vos spams ou contactez-nous :

- **Email** : support@stainedglass.tn  
- **Téléphone** : +216 XX XXX XXX

Nous restons à votre disposition pour toute question complémentaire.  
Encore merci pour votre confiance !

<!-- 🔁 Auto-redirect fallback au cas où Paymee bloquerait l’envoi du message postMessage -->
<script>
  setTimeout(() => {
    if (!document.referrer.includes("paymee")) return;
    window.location.replace("/merci/");
  }, 3000);
</script>
