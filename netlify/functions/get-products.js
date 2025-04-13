export async function handler(event) {
  const DOLIBARR_URL = process.env.DOLIBARR_URL;
  const DOLIBARR_TOKEN = process.env.DOLIBARR_TOKEN;

  console.log("📦 URL cible :", DOLIBARR_URL);
  console.log("🔐 Clé API présente :", !!DOLIBARR_TOKEN);

  try {
    const res = await fetch(`${DOLIBARR_URL}/products`, {
      headers: {
        "DOLAPIKEY": DOLIBARR_TOKEN,
        "Accept": "application/json"
      }
    });

    console.log("🌐 Status Dolibarr:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("🛑 Réponse Dolibarr non 200:", text);
      return {
        statusCode: res.status,
        body: JSON.stringify({ message: "Erreur côté Dolibarr", response: text })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("❌ Exception fetch:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erreur Dolibarr", error: err.message })
    };
  }
}
