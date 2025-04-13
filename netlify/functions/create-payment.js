// Netlify Function: create-payment.js
export async function handler(event) {
  const body = JSON.parse(event.body);

  const DOMAIN = process.env.DOMAIN || "https://resplendent-centaur-abf462.netlify.app";

  try {
    const response = await fetch("https://sandbox.paymee.tn/api/v2/payments/create", {
      method: "POST",
      headers: {
        "Authorization": "Token " + process.env.PAYMEE_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vendor: 3724,
        amount: body.amount,
        note: "Commande checkout",
        first_name: body.prenom,
        last_name: body.nom,
        email: body.email,
        phone: body.tel,
        return_url: DOMAIN + "/merci",
        cancel_url: DOMAIN + "/checkout",
        webhook_url: DOMAIN + "/webhook"
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Erreur Paymee:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors de la création du paiement Paymee." })
    };
  }
}
