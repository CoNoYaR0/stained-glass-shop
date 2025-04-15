
document.addEventListener("DOMContentLoaded", () => {
  const countdownElem = document.getElementById("countdown");
  if (!countdownElem) return;

  const duration = 5 * 60; // 5 minutes
  let remaining = duration;

  const timer = setInterval(() => {
    const min = Math.floor(remaining / 60).toString().padStart(2, "0");
    const sec = (remaining % 60).toString().padStart(2, "0");
    countdownElem.textContent = `${min}:${sec}`;

    if (remaining <= 0) {
      clearInterval(timer);
      document.getElementById("pdf-timer").innerHTML =
        "⏱️ Ce lien est expiré. Merci de revalider votre commande pour obtenir une nouvelle facture.";
    }

    remaining--;
  }, 1000);
});
