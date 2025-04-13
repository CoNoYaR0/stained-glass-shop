export async function handler(event) {
    const DOLIBARR_URL = process.env.DOLIBARR_URL;
    const DOLIBARR_TOKEN = process.env.DOLIBARR_TOKEN;
  
    try {
      const res = await fetch(`${DOLIBARR_URL}/products`, {
        headers: {
          "DOLAPIKEY": DOLIBARR_TOKEN
        }
      });
  
      const data = await res.json();
  
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Erreur Dolibarr", error: err.message })
      };
    }
  }
  