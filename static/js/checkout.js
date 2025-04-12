document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("checkout-app");

  if (!app) return;

  app.innerHTML = `
    <p>Chargement du résumé de votre commande...</p>
  `;
});
