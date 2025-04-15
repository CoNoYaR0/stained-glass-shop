
// /static/js/currency-symbol.js

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const currency = data.currency || "TND";
    const country = data.country || "TN";

    const symbolMap = {
      "EUR": "€",
      "USD": "$",
      "CAD": "$",
      "GBP": "£",
      "TND": "TND",
      "MAD": "MAD",
      "DZD": "DZD"
    };

    // Fallback basé sur la proximité
    const proximityFallback = {
      "TN": "TND",
      "FR": "EUR",
      "BE": "EUR",
      "IT": "EUR",
      "DE": "EUR",
      "ES": "EUR",
      "US": "USD",
      "CA": "CAD",
      "MA": "MAD",
      "DZ": "DZD"
    };

    const fallbackCurrency = proximityFallback[country] || "USD";
    const finalCurrency = symbolMap[currency] ? currency : fallbackCurrency;
    const symbol = symbolMap[finalCurrency] || finalCurrency;

    // 🔁 Remplace tous les textes se terminant par "TND"
    document.querySelectorAll(".price").forEach(p => {
      const match = p.textContent.match(/([\d\.,]+)\s*TND/i);
      if (match) {
        p.textContent = `${match[1]} ${symbol}`;
      }
    });
  } catch (err) {
    console.warn("🌍 Échec détection devise, fallback vers €/$", err);
    document.querySelectorAll(".price").forEach(p => {
      const match = p.textContent.match(/([\d\.,]+)\s*TND/i);
      if (match) {
        p.textContent = `${match[1]} €`;
      }
    });
  }
});
